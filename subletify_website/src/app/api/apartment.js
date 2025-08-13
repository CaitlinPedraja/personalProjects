const express = require('express');
const router = express.Router();
const pool = require('../../../db'); 

router.get('/', async (req, res) => {
  const { user_id } = req.query;
  console.log("hit")

  try {
    const result =  await pool.query( 
`SELECT fl.*, 
       bu.rating, 
       '{}'::bytea[] AS pics,
       CASE WHEN COUNT(fa.id) > 0 AND fa.user_id = $1 THEN true ELSE false END AS favorite
FROM public."apartment_listing" fl
JOIN public."business_user" bu
  ON bu.user_id = fl."user_id"
LEFT JOIN public."ApartmentImage" fi
  ON fi."ApartmentListingId" = fl.id
LEFT JOIN public.favorites fa
  ON fa.listing_id = fl.id AND fa.listing_type = 'apartment'
WHERE fi."imageData" IS NULL AND fl.approved = TRUE
GROUP BY fl.id, bu.rating, fa.user_id
UNION 
SELECT fl.*, 
       bu.rating, 
       ARRAY_AGG(fi."imageData") AS pics,
       CASE WHEN COUNT(fa.id) > 0 AND fa.user_id = $1 THEN true ELSE false END AS favorite
FROM public."apartment_listing" fl
JOIN public."business_user" bu
  ON bu.user_id = fl."user_id"
JOIN public."ApartmentImage" fi
  ON fi."ApartmentListingId" = fl.id
LEFT JOIN public.favorites fa
  ON fa.listing_id = fl.id AND fa.listing_type = 'apartment'
WHERE fl.approved = TRUE
GROUP BY fl.id, bu.rating, fa.user_id;
`,[user_id]);



const apartments = result.rows.map(apartment => {
 
  return {
    ...apartment,
    pics: apartment.pics.map(pic => {
      return `data:image/jpeg;base64,${Buffer.from(pic[0]).toString('base64')}`; 
    }),
  };
});
    
    res.json(apartments); 
  } catch (err) {
    console.error('Error fetching apartment data:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/pending', async (req, res) => {
  try {
    console.log('Fetching pending apartment listings...');
    const pendingListings = await pool.query(`
      SELECT al.*, 
             '{}'::bytea[] AS pics
      FROM public."apartment_listing" al
      LEFT JOIN public."ApartmentImage" ai ON ai."ApartmentListingId" = al.id
      WHERE al.approved = FALSE AND ai."imageData" IS NULL 
      GROUP BY al.id
      UNION      
      SELECT al.*, 
      ARRAY_AGG(ai."imageData") AS pics
      FROM public."apartment_listing" al
      JOIN public."ApartmentImage" ai ON ai."ApartmentListingId" = al.id
      WHERE al.approved = FALSE
      GROUP BY al.id;
    `);

    const listings = pendingListings.rows.map((listing) => ({
      ...listing,
      pics: listing.pics.map((pic) =>
        `data:image/jpeg;base64,${Buffer.from(pic[0]).toString('base64')}`
      ),
    }));

    res.json(listings);
  } catch (error) {
    console.error('Error fetching pending apartment listings:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/suggestions-apt', async (req, res) => {
  const { user_id } = req.query;

  console.log('Received request for apartment suggestions for user_id:', user_id);

  try {
    // Fetch user's favorite apartments
    const favoriteQuery = `
      SELECT al.description, al.bedrooms
      FROM public.favorites f
      JOIN public.apartment_listing al ON f.listing_id = al.id
      WHERE f.user_id = $1 AND f.listing_type = 'apartment'
    `;
    const favorites = await pool.query(favoriteQuery, [user_id]);

    console.log('Favorites fetched:', favorites.rows);

    if (favorites.rows.length === 0) {
      console.log('No favorites found for user_id:', user_id);
      return res.json([]);
    }

    // Extract keywords from descriptions and bedroom counts
    const keywords = favorites.rows
      .map((row) => row.description?.split(' ') || [])
      .flat()
      .map((word) => word.toLowerCase());
    const bedrooms = favorites.rows.map((row) => row.bedrooms);

    console.log('Extracted keywords:', keywords);
    console.log('Extracted bedrooms:', bedrooms);

    // SQL query for suggestions
    const suggestionQuery = `
      SELECT al.*,
      '{}'::bytea[] AS pics,
      ( (LOWER(al.description) SIMILAR TO $1)::int +
      (al.bedrooms = ANY($2))::int) as match_score
      FROM public.apartment_listing al
      LEFT JOIN public."ApartmentImage" fi
      ON fi."ApartmentListingId" = al.id
      WHERE (
        -- Match any of the description keywords
        LOWER(al.description) SIMILAR TO $1
        OR al.bedrooms = ANY($2)
      )
      AND al.approved = TRUE
      AND al.id NOT IN (
        SELECT listing_id
        FROM public.favorites
        WHERE user_id = $3 AND listing_type = 'apartment'
      )
      AND fi."imageData" IS NULL
      UNION
      SELECT al.*,
      ARRAY_AGG(fi."imageData") AS pics,
      ( (LOWER(al.description) SIMILAR TO $1)::int +
        2* (al.bedrooms = ANY($2))::int) as match_score
      FROM public.apartment_listing al
      JOIN public."ApartmentImage" fi
      ON fi."ApartmentListingId" = al.id
      WHERE (
        -- Match any of the description keywords
        LOWER(al.description) SIMILAR TO $1
        OR al.bedrooms = ANY($2)
      )
      AND al.approved = TRUE
      AND al.id NOT IN (
        SELECT listing_id
        FROM public.favorites
        WHERE user_id = $3 AND listing_type = 'apartment'
      )
      GROUP BY al.id ORDER BY match_score DESC
      LIMIT 3;
    `;
    const keywordPattern = `%(${keywords.join('|')})%`;

    const result = await pool.query(suggestionQuery, [
      keywordPattern,
      bedrooms,
      user_id,
    ]);

    const suggestions = result.rows.map(suggestion => {
      return {
        ...suggestion,
        pics: suggestion.pics.map(pic => {
          return `data:image/jpeg;base64,${Buffer.from(pic[0]).toString('base64')}`; 
        }),
      };
    });

      res.json(suggestions);
    
  } catch (error) {
    console.error('Error fetching apartment suggestions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.get('/:id', async (req, res) => {
  const { id } = req.params; 
  const { user_id } = req.query;
  try {
    const result = await pool.query(
      `
SELECT fl.*, 
       bu.rating, 
       '{}'::bytea[] AS pics,
       CASE WHEN COUNT(fa.id) > 0 AND fa.user_id = $2 THEN true ELSE false END AS favorite
FROM public."apartment_listing" fl
JOIN public."business_user" bu
  ON bu.user_id = fl."user_id"
LEFT JOIN public."ApartmentImage" fi
  ON fi."ApartmentListingId" = fl.id
LEFT JOIN public.favorites fa
  ON fa.listing_id = fl.id AND fa.listing_type = 'apartment'
WHERE fi."imageData" IS NULL AND fl.id = $1
GROUP BY fl.id, bu.rating,fa.user_id 
UNION 
SELECT fl.*, 
       bu.rating, 
       ARRAY_AGG(fi."imageData") AS pics,
       CASE WHEN COUNT(fa.id) > 0 AND fa.user_id = $2 THEN true ELSE false END AS favorite
FROM public."apartment_listing" fl
JOIN public."business_user" bu
  ON bu.user_id = fl."user_id"
JOIN public."ApartmentImage" fi
  ON fi."ApartmentListingId" = fl.id
LEFT JOIN public.favorites fa
  ON fa.listing_id = fl.id AND fa.listing_type = 'apartment'
WHERE fl.id = $1
GROUP BY fl.id, bu.rating,fa.user_id;`, [id,user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Listing item not found' });
    }

    const apartment = {
      ...result.rows[0],
      pics: result.rows[0].pics.map(pic => `data:image/jpeg;base64,${Buffer.from(pic[0]).toString('base64')}`),
      
    };
    
    res.json(apartment);
  } catch (err) {
    console.error(`Error fetching listing item:`, err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/upload', async (req, res) => {
  try {
    const { price, location, amenities, description, availability, policies, pics, bedrooms, bathrooms, user_id } = req.body;
    const result = await pool.query(
      `INSERT INTO apartment_listing (user_id, price, location, amenities, description, availability, policies,  bedrooms, bathrooms)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        user_id,
        price,
        location,
        amenities,
        description,
        availability,
        policies,
        bedrooms,
        bathrooms,
      ]
    );

    const apartmentListingId = result.rows[0].id;

    if (Array.isArray(pics) && pics.length > 0) { 
      for (const pic of pics) {
        
        const bufferPic = [Buffer.from(pic, 'base64')];

        await pool.query(
          `INSERT INTO "ApartmentImage" ("imageData", "ApartmentListingId")
           VALUES ($1, $2) RETURNING id`,
          [bufferPic, apartmentListingId]
        );
      }
    }
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error saving listing:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message }); // Validation error
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { description, price, location, availability, bedrooms, bathrooms, amenities, policies, pics } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE public."apartment_listing"
       SET description = $1, price = $2, location = $3, availability = $4, 
           bedrooms = $5, bathrooms = $6, amenities = $7, policies = $8, approved = FALSE
       WHERE id = $9 RETURNING *`,
      [description, price, location, availability, bedrooms, bathrooms, amenities, policies,  id]
    );
    const result1 = await pool.query(
      `Delete FROM public."ApartmentImage"
         WHERE "ApartmentListingId" = $1 `,
        [id]
    );  

    if (Array.isArray(pics) && pics.length > 0) { 
      for (const pic of pics) {
        console.log(pic);
        const bufferPic = [Buffer.from(pic, 'base64')];
console.log("bf", bufferPic);
        await pool.query(
          `INSERT INTO "ApartmentImage" ("imageData", "ApartmentListingId")
           VALUES ($1, $2) RETURNING id`,
          [bufferPic, id]
        );
      }
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Apartment listing not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating apartment listing:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;
  const type = "apartment";
  try {
  
    const result = await pool.query('DELETE FROM public."apartment_listing" WHERE id = $1 RETURNING *', [id]);
    const result1 = await pool.query('DELETE FROM public."ApartmentImage" WHERE "ApartmentListingId" = $1 RETURNING *', [id]);
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

router.get('/mylistings/:user_id', async (req, res) => {
  const { user_id } = req.params;
  try {
    const query = await pool.query(` SELECT fl.*, 
           bu.rating, 
           '{}'::bytea[] AS pics,
           CASE 
             WHEN COUNT(fa.id) > 0 AND fa.user_id = $1 THEN true 
             ELSE false 
           END AS favorite
    FROM public."apartment_listing" fl
    JOIN public."business_user" bu
      ON bu.user_id = fl."user_id"
    LEFT JOIN public."ApartmentImage" fi
      ON fi."ApartmentListingId" = fl.id
    LEFT JOIN public.favorites fa
      ON fa.listing_id = fl.id AND fa.listing_type = 'apartment'
    WHERE fi."imageData" IS NULL AND fl.user_id = $1
    GROUP BY fl.id, bu.rating,fa.user_id
    UNION 
    SELECT fl.*, 
           bu.rating, 
           ARRAY_AGG(fi."imageData") AS pics,
           CASE 
             WHEN COUNT(fa.id) > 0 AND fa.user_id = $1 THEN true 
             ELSE false 
           END AS favorite
    FROM public."apartment_listing" fl
    JOIN public."business_user" bu
      ON bu.user_id = fl."user_id"
    JOIN public."ApartmentImage" fi
      ON fi."ApartmentListingId" = fl.id
    LEFT JOIN public.favorites fa
      ON fa.listing_id = fl.id AND fa.listing_type = 'apartment'
  WHERE fl.user_id = $1
    GROUP BY fl.id, bu.rating,fa.user_id ;
    `,[user_id]);


    const apartments = query.rows.map(apartment => ({
      ...apartment,
      pics: apartment.pics.map(pic =>
        `data:image/jpeg;base64,${Buffer.from(pic[0]).toString('base64')}`
      ),
    }));

    res.json(apartments);
  } catch (error) {
    console.error('Error fetching favorite items:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.patch('/:id/approve', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE public."apartment_listing"
       SET approved = TRUE
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Apartment listing not found' });
    }

    res.json({ message: 'Apartment listing approved successfully', listing: result.rows[0] });
  } catch (error) {
    console.error('Error approving apartment listing:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.patch('/:id/disapprove', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM public."apartment_listing"
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Apartment listing not found' });
    }

    res.json({ message: 'Apartment listing rejected successfully', listing: result.rows[0] });
  } catch (error) {
    console.error('Error rejected apartment listing:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});





module.exports = router;