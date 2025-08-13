const express = require('express');
const router = express.Router();
const pool = require('../../../db'); // Adjust path as needed

// Endpoint to get messages between two users
router.get('/', async (req, res) => {
  const { senderId, recipientId } = req.query;

  try {
    const result = await pool.query(
      `SELECT m.*, 
              u1.name AS sender_name, 
              u2.name AS recipient_name
       FROM public.messages m
       JOIN public."User" u1 ON m.sender_id = u1.id
       JOIN public."User" u2 ON m.recipient_id = u2.id
       WHERE (m.sender_id = $1 AND m.recipient_id = $2)
          OR (m.sender_id = $2 AND m.recipient_id = $1)
       ORDER BY m.timestamp ASC`, 
      [senderId, recipientId]
    );

    if (result.rows.length === 0) {
      // No messages found, return only recipient's name for blank conversation
      const nameResult = await pool.query(
        'SELECT name FROM public."User" WHERE id = $1', 
        [recipientId]
      );
      res.json({ hasMessages: false, recipient_name: nameResult.rows[0]?.name || 'Unknown' });
    } else {
      // Messages found, return the full message list
      res.json({ hasMessages: true, messages: result.rows });
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/conversations', async (req, res) => {
  const { userId } = req.query;

  try {
    const result = await pool.query(
      `SELECT m.*, 
              u1.name AS sender_name, 
              u2.name AS recipient_name
       FROM messages m
       JOIN public."User" u1 ON m.sender_id = u1.id
       JOIN public."User" u2 ON m.recipient_id = u2.id
       WHERE m.sender_id = $1 OR m.recipient_id = $1
       ORDER BY m.timestamp ASC`,
      [userId]
    );

    const groupedConversations = result.rows.reduce((acc, message) => {
      const isSender = message.sender_id === userId;
      const conversationPartnerId = isSender ? message.recipient_id : message.sender_id;
      const conversationPartnerName = isSender ? message.recipient_name : message.sender_name;

      if (!acc[conversationPartnerId]) {
        acc[conversationPartnerId] = { 
          conversation_partner_id: conversationPartnerId,
          conversation_partner_name: conversationPartnerName,
          messages: []
        };
      }
      acc[conversationPartnerId].messages.push({
        sender_id: message.sender_id,
        recipient_id: message.recipient_id,
        message_text: message.message_text,
        timestamp: message.timestamp,
        recipient_name: message.recipient_name
      });
      return acc;
    }, {});
    console.log(groupedConversations);
    res.json(Object.values(groupedConversations));

  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.post('/', async (req, res) => {
  const { sender_id, recipient_id, message_text } = req.body;
console.log(sender_id, recipient_id, message_text);

try {
  // Check if sender and recipient exist
  const checkSender = await pool.query('SELECT id FROM public."User" WHERE id = $1', [sender_id]);
  const checkRecipient = await pool.query('SELECT id, name FROM public."User" WHERE id = $1', [recipient_id]);
  
  if (checkSender.rowCount === 0) {
    return res.status(400).json({ error: `Sender ID ${sender_id} does not exist.` });
  }
  
  if (checkRecipient.rowCount === 0) {
    return res.status(400).json({ error: `Recipient ID ${recipient_id} does not exist.` });
  }
  const recipientName = checkRecipient.rows[0].name;
  const existingConversation = await pool.query(
    `SELECT conversation_id
     FROM messages
     WHERE (sender_id = $1 AND recipient_id = $2) 
        OR (sender_id = $2 AND recipient_id = $1) 
     LIMIT 1`,
    [sender_id, recipient_id]
  );
  let result;
  if (existingConversation.rows.length > 0){
    const conversationId = existingConversation.rows[0].conversation_id;
      // Insert the message
   result = await pool.query(
    `INSERT INTO messages (conversation_id, sender_id, recipient_id, message_text, timestamp)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING *`,
    [conversationId, sender_id, recipient_id, message_text]
  );
  } else{
     result = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, recipient_id, message_text, timestamp)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())
       RETURNING *`,
      [sender_id, recipient_id, message_text]
    );
    
  }
console.log(recipientName);

  return res.status(201).json({ ...result.rows[0], recipient_name: recipientName });
} catch (error) {
  console.error("Error inserting message:", error);
  return res.status(500).json({ error: "Internal Server Error" });
}
});

module.exports = router;
