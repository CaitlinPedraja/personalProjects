const express = require('express');
const router = express.Router();
const pool = require('../../../db'); 

router.get('/', async (req, res) => {
  console.log("in 1")
  const { user_id } = req.query;

  try {
    const query = `
      SELECT fl.*, 
             bu.rating, 
             '{}'::bytea[] AS pics,
             CASE 
               WHEN COUNT(fa.id) > 0 AND fa.user_id = $1 THEN true 
               ELSE false 
             END AS favorite
      FROM public."furniture_listing" fl
      JOIN public."business_user" bu
        ON bu.user_id = fl."user_id"
      LEFT JOIN public."FurnitureImage" fi
        ON fi."FurnitureListingId" = fl.id
      LEFT JOIN public.favorites fa
        ON fa.listing_id = fl.id AND fa.listing_type = 'furniture'
      WHERE fi."imageData" IS NULL AND fl.approved = TRUE
      GROUP BY fl.id, bu.rating, fa.user_id
      UNION 
      SELECT fl.*, 
             bu.rating, 
             ARRAY_AGG(fi."imageData") AS pics,
             CASE 
               WHEN COUNT(fa.id) > 0 AND fa.user_id = $1 THEN true 
               ELSE false 
             END AS favorite
      FROM public."furniture_listing" fl
      JOIN public."business_user" bu
        ON bu.user_id = fl."user_id"
      JOIN public."FurnitureImage" fi
        ON fi."FurnitureListingId" = fl.id
      LEFT JOIN public.favorites fa
        ON fa.listing_id = fl.id AND fa.listing_type = 'furniture'
      WHERE fl.approved = TRUE
      GROUP BY fl.id, bu.rating, fa.user_id;
    `;

    const result = await pool.query(query, [user_id]);

    const furnitures = result.rows.map(furniture => {
     
      return {
        ...furniture,
        pics: furniture.pics.map(pic => {
          return `data:image/jpeg;base64,${Buffer.from(pic[0]).toString('base64')}`; // Convert each Buffer to Base64
        }),
      };
    });
    

    res.json(furnitures); 
  } catch (err) {
    console.error('Error fetching furniture data:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/pending', async (req, res) => {
  console.log("in 2")

  try {
    console.log('Fetching pending furniture listings...');
      
    const pendingListings = await pool.query(`
      SELECT fl.*, 
             '{}'::bytea[] AS pics
      FROM furniture_listing fl
      LEFT JOIN "FurnitureImage" fi ON fi."FurnitureListingId" = fl.id
      WHERE approved = FALSE AND fi."imageData" IS NULL
      GROUP BY fl.id
      UNION
      SELECT fl.*, 
      ARRAY_AGG(fi."imageData") AS pics
      FROM furniture_listing fl
      JOIN "FurnitureImage" fi ON fi."FurnitureListingId" = fl.id
      WHERE approved = FALSE
      GROUP BY fl.id;
    `);
      
    const listings = pendingListings.rows.map((listing) => ({
      ...listing,
      pics: listing.pics.map((pic) => 
        `data:image/jpeg;base64,${Buffer.from(pic[0]).toString('base64')}`
      ),
    }));
      
    res.json(listings);
  } catch (error) {
    console.error('Error fetching pending listings:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.get('/suggestions', async (req, res) => {
  console.log("in 3")

  const { user_id } = req.query;

  console.log('Received request for suggestions for user_id:', user_id);

  try {
    // Fetch the user's favorites
    const favoriteQuery = `
      SELECT fl.description, fl.colors
      FROM public.favorites f
      JOIN public.furniture_listing fl ON f.listing_id = fl.id
      WHERE f.user_id = $1 AND f.listing_type = 'furniture'
    `;
    const favorites = await pool.query(favoriteQuery, [user_id]);

    // console.log('Favorites fetched:', favorites.rows);

    if (favorites.rows.length === 0) {
      // console.log('No favorites found for user_id:', user_id);
      return res.json([]);
    }

    const keywords = favorites.rows
      .map((row) => row.description.split(' '))
      .flat()
      .map((word) => word.toLowerCase());
    const colors = favorites.rows
      .map((row) => row.colors || [])
      .flat();

    // console.log('Extracted keywords:', keywords);
    // console.log('Extracted colors:', colors);

    const suggestionQuery = `
    SELECT fl.*,
    '{}'::bytea[] AS pics,
    ((LOWER(fl.description) SIMILAR TO $1)::int + 
    (fl.colors::text SIMILAR TO $2)::int) AS match_score
    FROM public.furniture_listing fl
    LEFT JOIN public."FurnitureImage" fi
    ON fi."FurnitureListingId" = fl.id
    WHERE (
    LOWER(fl.description) SIMILAR TO $1
    OR fl.colors::text SIMILAR TO $2
    )
    AND fl.approved = TRUE
    AND fl.id NOT IN (
    SELECT listing_id FROM public.favorites WHERE user_id = $3 AND listing_type = 'furniture'
    )
    AND fi."imageData" IS NULL
    UNION 
    SELECT fl.*,
    ARRAY_AGG(fi."imageData") AS pics,
    2*((LOWER(fl.description) SIMILAR TO $1)::int + 
    (fl.colors::text SIMILAR TO $2)::int) AS match_score
    FROM public.furniture_listing fl
    JOIN public."FurnitureImage" fi
    ON fi."FurnitureListingId" = fl.id
    WHERE (
    LOWER(fl.description) SIMILAR TO $1
    OR fl.colors::text SIMILAR TO $2
    )
    AND fl.approved = TRUE
    AND fl.id NOT IN (
    SELECT listing_id FROM public.favorites WHERE user_id = $3 AND listing_type = 'furniture'
    )
    GROUP BY fl.id ORDER BY match_score DESC
    LIMIT 3;
    `;
    const keywordPattern = `%(${keywords.join('|')})%`;
    const colorPattern = `%(${colors.join('|')})%`;

    // console.log('Keyword pattern for query:', keywordPattern);
    // console.log('Color pattern for query:', colorPattern);

    const result = await pool.query(suggestionQuery, [
      keywordPattern,
      colorPattern,
      user_id,
    ]);

    // console.log('Suggestions fetched:', suggestions.rows);
    const suggestions = result.rows.map(suggestion => {
      return {
        ...suggestion,
        pics: suggestion.pics.map(pic => {
          return `data:image/jpeg;base64,${Buffer.from(pic[0]).toString('base64')}`; // Convert each Buffer to Base64
        }),
      };
    });


      res.json(suggestions);
    
    

    // console.log('Randomized suggestions:', randomSuggestions);

    
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.get('/:id', async (req, res) => {
  console.log("in 4")

  const { user_id } = req.query;
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT fl.*, 
       bu.rating, 
       '{}'::bytea[] AS pics, u.name,
       CASE WHEN COUNT(fa.id) > 0 AND fa.user_id = $2 THEN true ELSE false END AS favorite
FROM public."furniture_listing" fl
JOIN public."business_user" bu
  ON bu.user_id = fl."user_id"
LEFT JOIN public."FurnitureImage" fi
  ON fi."FurnitureListingId" = fl.id
JOIN public."User" u on u.id = fl."user_id"
LEFT JOIN public.favorites fa
  ON fa.listing_id = fl.id AND fa.listing_type = 'furniture'
WHERE fi."imageData" IS NULL AND fl.id = $1
GROUP BY fl.id, bu.rating,u.name,fa.user_id 
UNION 
SELECT fl.*, 
       bu.rating, 
       ARRAY_AGG(fi."imageData") AS pics, u.name,
       CASE WHEN COUNT(fa.id) > 0 AND fa.user_id = $2 THEN true ELSE false END AS favorite
FROM public."furniture_listing" fl
JOIN public."business_user" bu
  ON bu.user_id = fl."user_id"
JOIN public."FurnitureImage" fi
  ON fi."FurnitureListingId" = fl.id
 JOIN public."User" u on u.id = fl."user_id"
 LEFT JOIN public.favorites fa
  ON fa.listing_id = fl.id AND fa.listing_type = 'furniture'
WHERE fl.id = $1
GROUP BY fl.id, bu.rating,u.name, fa.user_id ;`, [id, user_id] 
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Furniture item not found' });
    }

    const furniture = {
      ...result.rows[0],
      pics: result.rows[0].pics.map(pic => `data:image/jpeg;base64,${Buffer.from(pic[0]).toString('base64')}`),
      
    };

    res.json(furniture); 
  } catch (err) {
    console.log("hello")
    console.error(`Error fetching furniture item:`, err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.post('/check-or-add-user', async (req, res) => {
  console.log("in 5")

  const { user_id } = req.body;

  try {
    const userCheck = await pool.query('SELECT * FROM public."business_user" WHERE user_id = $1', [user_id]);

    if (userCheck.rows.length === 0) {
      const insertUser = await pool.query(
        'INSERT INTO public."business_user" (user_id, rating) VALUES ($1, $2) RETURNING *',
        [user_id, 5] 
      );

      if (insertUser.rows.length === 0) {
        return res.status(500).json({ error: 'Failed to insert user into business_user table' });
      }
      return res.status(201).json({ message: 'User added successfully', user: insertUser.rows[0] });
    }

    return res.status(200).json({ message: 'User already exists', user: userCheck.rows[0] });
  } catch (error) {
    console.error('Error checking or adding user:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/upload', async (req, res) => {
  console.log("in 6")

  try {
    const { price, description, condition, pics, user_id, location, colors } = req.body;

   
    const colorsArray = colors ? JSON.stringify(colors) : null;

    // Insert furniture listing into the database
    const result = await pool.query(
      `INSERT INTO furniture_listing (user_id, price, description, condition, colors, location, approved)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE) RETURNING *`,
      [user_id, price, description, condition, colorsArray, location]
    );

    const furnitureListingId = result.rows[0].id;
    console.log("bfs", pics, Array.isArray(pics));
    if (Array.isArray(pics) && pics.length === 0) {
     
    } else if (Array.isArray(pics)) { 
      for (const pic of pics) {
        
        const bufferPic = [Buffer.from(pic, 'base64')];

        await pool.query(
          `INSERT INTO "FurnitureImage" ("imageData", "FurnitureListingId")
           VALUES ($1, $2) RETURNING id`,
          [bufferPic, furnitureListingId]
        );
      }
    }

    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error saving furniture listing:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.post('/check-or-add-user', async (req, res) => {
  console.log("in 7")

  const { user_id } = req.body;
console.log(user_id);
  try {
    const userCheck = await pool.query('SELECT * FROM public."business_user" WHERE user_id = $1', [user_id]);

    if (userCheck.rows.length === 0) {
      // If the user doesn't exist, insert them into the business_user table
      const insertUser = await pool.query(
        'INSERT INTO public."business_user" (user_id, rating) VALUES ($1, $2) RETURNING *',
        [user_id, 5]  // Default rating of 5
      );

      if (insertUser.rows.length === 0) {
        return res.status(500).json({ error: 'Failed to insert user into business_user table' });
      }
      return res.status(201).json({ message: 'User added successfully', user: insertUser.rows[0] });
    }

    return res.status(200).json({ message: 'User already exists', user: userCheck.rows[0] });
  } catch (error) {
    console.error('Error checking or adding user:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/:id', async (req, res) => {
  console.log("in 8")

  const { id } = req.params;
  const { price, description, condition, colors, location, pics } = req.body;
  
  try {
    const colorsArray = colors ? JSON.stringify(colors) : null;

    const result = await pool.query(
      `UPDATE public."furniture_listing"
       SET price = $1, description = $2, condition = $3, colors = $4, location = $5, approved = FALSE
       WHERE id = $6 RETURNING *`,
      [price, description, condition, colorsArray, location, id]
    );
  const result1 = await pool.query(
    `Delete FROM public."FurnitureImage"
       WHERE "FurnitureListingId" = $1 `,
      [id]
  );  
  if (Array.isArray(pics) && pics.length > 0) { 
      for (const pic of pics) {
        console.log(pic);
        const bufferPic = [Buffer.from(pic, 'base64')];
console.log("bf", bufferPic);
        await pool.query(
          `INSERT INTO "FurnitureImage" ("imageData", "FurnitureListingId")
           VALUES ($1, $2) RETURNING id`,
          [bufferPic, id]
        );
      }
    }


    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Listing not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating listing:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/delete/:id', async (req, res) => {
  console.log("in 9")

  const { id } = req.params;
  const type = "furniture";
  try {
  
    const result = await pool.query('DELETE FROM public."furniture_listing" WHERE id = $1 RETURNING *', [id]);
    const result1 = await pool.query('DELETE FROM public."FurnitureImage" WHERE "FurnitureListingId" = $1 RETURNING *', [id]);
    const result2 = await pool.query('DELETE FROM public."favorites" WHERE "listing_id" = $1 AND "listing_type" = $2 RETURNING *', [id, type]);

    if (result.rows.length && result1.rows.length && result2.rows.length) {
      res.json({ message: 'Listing deleted successfully' });
    } else {
      res.status(404).json({ error: 'Listing not found' });
    }
  } catch (error) {
    console.error('Error deleting listing:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.patch('/:id/favorite', async (req, res) => { 
  console.log("in 10")

  try{
    const {user_id, listing_id, listing_type, favorite} = req.body;
    let result;
    if (favorite){ 
    result = await pool.query('INSERT INTO "favorites" (user_id, listing_id, listing_type) VALUES ($1,$2,$3)', [user_id, listing_id, listing_type]);
  }else{
    result = await pool.query('DELETE FROM "favorites" WHERE user_id = $1 AND listing_id = $2 AND listing_type = $3', [user_id, listing_id, listing_type]);
  }
  return res.status(200).json({ message: 'Favorite status updated successfully' });

  }catch (error){
    console.log(error);
    res.status(500).json({error: "could not insert to favorites"});
  }
  });

  router.get('/mylistings/:user_id', async (req, res) => {
    console.log("in 11")

    const { user_id } = req.params;
    try {
      const query = await pool.query(`SELECT fl.*, 
             bu.rating, 
             '{}'::bytea[] AS pics,
             CASE 
               WHEN COUNT(fa.id) > 0 AND fa.user_id = $1 THEN true 
               ELSE false 
             END AS favorite,
             fl.approved
      FROM public."furniture_listing" fl
      JOIN public."business_user" bu
        ON bu.user_id = fl."user_id"
      LEFT JOIN public."FurnitureImage" fi
        ON fi."FurnitureListingId" = fl.id
      LEFT JOIN public.favorites fa
        ON fa.listing_id = fl.id AND fa.listing_type = 'furniture'
      WHERE fi."imageData" IS NULL AND fl.user_id = $1
      GROUP BY fl.id, bu.rating,fa.user_id
      UNION 
      SELECT fl.*, 
             bu.rating, 
             ARRAY_AGG(fi."imageData") AS pics,
             CASE 
               WHEN COUNT(fa.id) > 0 AND fa.user_id = $1 THEN true 
               ELSE false 
             END AS favorite,
             fl.approved
      FROM public."furniture_listing" fl
      JOIN public."business_user" bu
        ON bu.user_id = fl."user_id"
      JOIN public."FurnitureImage" fi
        ON fi."FurnitureListingId" = fl.id
      LEFT JOIN public.favorites fa
        ON fa.listing_id = fl.id AND fa.listing_type = 'furniture'
		WHERE fl.user_id = $1
      GROUP BY fl.id, bu.rating,fa.user_id ;
      `,[user_id]);
  

      const furnitures = query.rows.map(furniture => ({
        ...furniture,
        pics: furniture.pics.map(pic =>
          `data:image/jpeg;base64,${Buffer.from(pic[0]).toString('base64')}`
        ),
      }));

      console.log("furnitures", furnitures);
  
      res.json(furnitures);
    } catch (error) {
      console.error('Error fetching favorite items:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });


  router.patch('/:id/approve', async (req, res) => {
    const { id } = req.params;
  
    // Validate ID
    if (isNaN(parseInt(id, 10))) {
      console.error(`Invalid ID provided: ${id}`);
      return res.status(400).json({ error: 'Invalid ID' });
    }
  
    console.log('Attempting to approve listing with ID:', id);
  
    try {
      const result = await pool.query(
        `UPDATE furniture_listing SET approved = TRUE WHERE id = $1 RETURNING *`,
        [id]
      );
  
      console.log('Query result:', result.rows);
  
      if (result.rowCount === 0) {
        console.log('Listing not found for ID:', id);
        return res.status(404).json({ error: 'Listing not found' });
      }
  
      console.log('Listing approved successfully:', result.rows[0]);
  
      res.json({ message: 'Listing approved successfully', listing: result.rows[0] });
    } catch (error) {
      console.error('Error approving listing:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  
  router.patch('/:id/disapprove', async (req, res) => {
    const { id } = req.params;
  
    try {
      const result = await pool.query(
        `DELETE FROM public."furniture_listing"
         WHERE id = $1
         RETURNING *`,
        [id]
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Furniture listing not found' });
      }
  
      res.json({ message: 'Furniture listing rejected successfully', listing: result.rows[0] });
    } catch (error) {
      console.error('Error rejected furniture listing:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

module.exports = router; 