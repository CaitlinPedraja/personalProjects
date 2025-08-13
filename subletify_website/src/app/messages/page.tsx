"use client";

import { useEffect, useState, Suspense  } from 'react';
import { io } from "socket.io-client";
import { useSession } from 'next-auth/react';
import { Accordion, AccordionSummary, AccordionDetails, Typography, TextField, Button, CircularProgress } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useSearchParams } from 'next/navigation';

const socket = io('http://localhost:5001', { transports: ['websocket'] });

interface Message {
  sender_id: string;
  recipient_id: string;
  message_text: string;
  timestamp: string;
  recipient_name?: string; 
}

interface Conversation {
  conversation_partner_name: string; 
  conversation_partner_id: string;
  messages: Message[];
}

const MessagesContent = () => {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const recipientId = searchParams.get('recipientId');
  const senderId = searchParams.get('sellerId');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  if (!session) {
    return <p>Please log in to view your messages.</p>;
  } 

  useEffect(() => {
    if (session) {
      const fetchConversations = async () => {
        try {
          const response = await fetch(`http://localhost:5001/api/message/conversations?userId=${session.user.id}`);
          const data: Conversation[] = await response.json();

          
          const updatedConversations = data.map(conversation => ({
            ...conversation,
            conversation_partner_name: conversation.conversation_partner_name 
          }));

          setConversations(updatedConversations);
        } catch (error) {
          console.error("Error fetching conversations:", error);
        }
      };
      fetchConversations();
    }
  }, [session]);



  useEffect(() => {
    socket.on('message', (messageData: Message) => {
      console.log('Message received:', messageData); 
  
      setConversations((prevConversations) => {
        return prevConversations.map((conversation) => {
          const messages = Array.isArray(conversation.messages) ? conversation.messages : [];
  
         
          if (
            conversation.conversation_partner_id === messageData.sender_id || 
            conversation.conversation_partner_id === messageData.recipient_id
          ) {
            return { 
              ...conversation, 
              messages: [...messages, messageData] 
            };
          }
          return conversation;
        });
      });
    });
  
    return () => {
      socket.off('message'); 
    };
  }, []);

  const handleSendMessage = async (recipientId: string, recipient_name: string) => {
    if (newMessage.trim() && recipientId) {
      const messageData: Message = {
        sender_id: session.user.id,
        recipient_id: recipientId,
        message_text: newMessage,
        timestamp: new Date().toISOString(),
        recipient_name: recipient_name 
      };
  
      console.log('Sending message:', messageData); 
      socket.emit('message', messageData); 
  
      try {
        const response = await fetch('http://localhost:5001/api/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(messageData),
        });
        const savedMessage = await response.json();
  
        setConversations((prevConversations) =>
          prevConversations.map((conversation) =>
            conversation.conversation_partner_id === recipientId 
              ? {
                  ...conversation,
                  messages: [...(conversation.messages || []), savedMessage], 
                }
              : conversation
          )
        );
      } catch (error) {
        console.error("Error saving message:", error);
      }
  
      setNewMessage(''); 
    }
  };
  


  useEffect(() => {
    if (recipientId && senderId) {
      const fetchOrCreateConversation = async () => {
        try {
          const response = await fetch(`http://localhost:5001/api/message?senderId=${senderId}&recipientId=${recipientId}`);
          const data = await response.json();

          //first time texting
          if (!data.hasMessages) {
            setConversations([
              {
                conversation_partner_name: data.recipient_name || 'Unknown',
                conversation_partner_id: recipientId,
                messages: [],
              },
            ]);
          } else {
            // Existing conversation 
            setConversations([
              {
                conversation_partner_name: data.messages[0]?.recipient_name || data.messages[0]?.name || 'Unknown',
                conversation_partner_id: recipientId,
                messages: data.messages,
              },
            ]);
          }
          setSelectedConversation(recipientId);
        } catch (error) {
          console.error("Error initializing conversation:", error);
        }
      };
      fetchOrCreateConversation();
    }
  }, [recipientId, senderId]);
  



  return (
    <div className="p-4 min-h-screen bg-gray-50">
  <h1 className="mb-4 font-semibold text-2xl font-mono text-gray-800">Your Conversations</h1>
  {conversations.map((conversation) => (
    <Accordion
      key={conversation.conversation_partner_id}
      className="border border-gray-200 shadow-md mb-4 rounded-lg"
      expanded={selectedConversation === conversation.conversation_partner_id}
      onChange={() => setSelectedConversation(
        selectedConversation === conversation.conversation_partner_id ? null : conversation.conversation_partner_id 
      )}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon className="text-gray-600" />}
        className="px-4 py-2 border-b border-gray-200 bg-gray-100 hover:bg-gray-300 rounded-lg"
      >
        <Typography className="font-semibold text-gray-700">
          {conversation.conversation_partner_name}
        </Typography>
      </AccordionSummary>
      <AccordionDetails className="bg-white p-4">
        <div className="message-list space-y-3">
          {conversation.messages && conversation.messages.length > 0 ? (
            conversation.messages.map((msg) => (
              <div 
                key={`${msg.sender_id}-${msg.timestamp}`} 
                className={`max-w-[75%] p-3 rounded-lg shadow-md ${
                  msg.sender_id === session.user.id 
                    ? "bg-blue-500 text-white ml-auto" 
                    : "bg-gray-200 text-gray-900 mr-auto"
                } ${msg.sender_id === session.user.id ? "rounded-br-none" : "rounded-bl-none"}`}
              >
                <p className="text-sm">
                  {msg.message_text}
                </p>
                <small className={`text-xs mt-1 block ${msg.sender_id === session.user.id ? "text-blue-200" : "text-gray-500"}`}>
                  {new Date(msg.timestamp).toLocaleString()}
                </small>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No messages to display</p>
          )}
        </div>
        <div className="mt-4">
          <TextField
            label="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            fullWidth
            variant="outlined"
            margin="dense"
            className="bg-gray-50"
          />
          <Button 
            onClick={() => handleSendMessage(conversation.conversation_partner_id, conversation.conversation_partner_name)} 
            variant="contained" 
            color="primary" 
            className="mt-2 w-full"
          >
            Send
          </Button>
        </div>
      </AccordionDetails>
    </Accordion>
  ))}
</div>

  
  );
};

const MessagesPage = () => (
  <Suspense fallback={<CircularProgress />}>
    <MessagesContent />
  </Suspense>
);

export default MessagesPage;
