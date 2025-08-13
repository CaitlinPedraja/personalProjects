"use client";

import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import Button from '@mui/material/Button';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import CardMedia from '@mui/material/CardMedia';
import * as Yup from 'yup';
import LocationDropdown from '../../components/location-dropdown';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';


export default function ListingUpload() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [fileNames, setFileNames] = React.useState<string[]>([]);
  const { data: session } = useSession();
  const [location, setLocation] = React.useState('');
  const router = useRouter();
  const [imagePreview, setImagePreview] = React.useState<string[]>([]);
  const MAX_FILE_SIZE = 65 * 1024;

  // Validation schema for Formik using Yup
  const validationSchema = Yup.object({
    title: Yup.string()
      .min(5, 'Title must be at least 5 characters')
      .required('Title is required'),
    price: Yup.number()
      .min(0, 'Price must be at least 0')
      .max(5000, 'Price cannot exceed $5000')
      .required('Price is required'),
    description: Yup.string()
      .min(5, 'Description must be at least 5 characters')
      .required('Description is required'),
    availability: Yup.string()
      .min(5, 'Availability must be at least 5 characters')
      .required('Availability is required'),
    bedrooms: Yup.number()
      .min(0, 'Bedrooms must be at least 0')
      .max(20, 'Bedrooms cannot exceed 20')
      .required('Bedrooms are required'),
    bathrooms: Yup.number()
      .min(0, 'Bathrooms must be at least 0')
      .max(20, 'Bathrooms cannot exceed 20')
      .required('Bathrooms are required'),
    amenities: Yup.string()
      .min(5, 'Amenities must be at least 5 characters')
      .required('Amenities are required'),
    policies: Yup.string()
      .min(5, 'Policies must be at least 5 characters')
      .required('Policies are required'),
  });

  // Formik setup
  const formik = useFormik({
    initialValues: {
      title: '',
      price: 0,
      description: '',
      availability: '',
      bedrooms: 0,
      bathrooms: 0,
      amenities: '',
      policies: '',
    },
    validationSchema: validationSchema,
    validateOnBlur: true, // Enable validation on blur
    validateOnChange: true, // Enable validation on change
    onSubmit: async (values) => {
      console.log('setFiles', files);
      const byteArrays = await convertFilesToByteArray();
      console.log("b", byteArrays);
      const payload = {
        ...values,
        pics: byteArrays,
        user_id: session?.user?.id,
        location,
      };

      const checkUserResponse = await fetch('http://localhost:5001/api/furniture/check-or-add-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: session?.user?.id }),
      });

      // If the user check fails, exit early
      if (!checkUserResponse.ok) {
        console.error('Error checking or adding user:', checkUserResponse.statusText);
        return;
      }

      const checkUserData = await checkUserResponse.json();
      console.log('User Check/Add Response for Apartment:', checkUserData);


      const uploadResponse = await fetch('http://localhost:5001/api/apartment/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // If the upload is successful, redirect to the listings page
      if (uploadResponse.ok) {
        console.log("Apartment listing uploaded successfully.");
        router.push('/listings');
      } else {
        console.error("Failed to upload apartment listing:", uploadResponse.statusText);
      }
    },
  });

  // Handle file input change and update file names
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      const oversizedFiles = newFiles.filter(file => file.size > MAX_FILE_SIZE);
      if (oversizedFiles.length > 0) {
        alert(`The following files are too large: ${oversizedFiles.map(file => file.name).join(', ')}. Each file must be under 64KB.`);

        return;
      }
      // Append new files to the existing ones
      setFiles((prevFiles) => [...prevFiles, ...newFiles]);

      // Generate previews for all files 
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setImagePreview((prevPreviews) => [...prevPreviews, ...newPreviews]);

      // Append new file names to the existing list
      setFileNames((prevFileNames) => [...prevFileNames, ...newFiles.map(file => file.name)]);
    }
  };

  // Function to convert files to byte arrays
  const convertFilesToByteArray = async () => {
    const byteArrays: string[] = await Promise.all(
      files.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const byteString = reader.result as string;
            resolve(byteString.split(',')[1]); // Get the base64 part
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      })
    );
    return byteArrays;
  };
  React.useEffect(() => {
    return () => {
      imagePreview.forEach(preview => URL.revokeObjectURL(preview));
    };
  }, [imagePreview]);
  return (
    <Box className="flex flex-wrap md:flex-nowrap gap-16 p-6 w-full max-w-7xl mx-auto bg-white shadow-lg rounded-lg mt-10 border border-gray-200 text-gray-700">
      {/* Left Column: Image Previews */}
      <Box className="flex flex-col items-center w-full md:w-1/2 gap-4">
        <h3 className="text-2xl font-semibold">Image Preview</h3>
        <Box className="w-full h-full max-h-[400px] mt-2">
          {imagePreview.length > 0 ? (
            <Swiper
              spaceBetween={10}
              pagination={{ clickable: true }}
              modules={[Pagination]}
              className="h-full max-h-[400px] w-full"
            >
              {imagePreview.map((preview, index) => (
                <SwiperSlide key={index} className="h-full w-full">
                  <img
                    src={preview}
                    className="h-full w-full object-cover border border-gray-300 rounded-md"
                    alt={`Preview ${index + 1}`}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <Box className="h-full w-full flex items-center justify-center border border-dashed border-gray-400 rounded-md">
              <p className="text-gray-500">No images uploaded</p>
            </Box>
          )}
        </Box>
        <Button variant="contained" component="label" className="bg-black p-3 rounded-3xl mt-3 w-full">
          {fileNames.length > 0 ? `Uploaded Files: ${fileNames.join(', ')}` : 'Upload Image'}
          <input
            type="file"
            hidden
            onChange={handleFileChange}
            multiple
          />
        </Button>
      </Box>

      {/* Right Column: Form */}
      <form onSubmit={formik.handleSubmit} className="flex flex-col items-center gap-4 w-full md:w-1/2">
        <h2 className="text-2xl font-semibold mb-4">New Apartment Listing</h2>

        <TextField
          label="Title"
          variant="outlined"
          fullWidth
          name="title"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.title}
          error={formik.touched.title && Boolean(formik.errors.title)}
          helperText={formik.touched.title && formik.errors.title}
        />

        <FormControl fullWidth variant="outlined">
          <InputLabel htmlFor="outlined-adornment-price">Listing Price</InputLabel>
          <OutlinedInput
            id="outlined-adornment-price"
            startAdornment={<InputAdornment position="start">$</InputAdornment>}
            label="Listing Price"
            name="price"
            type="number"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.price}
            error={formik.touched.price && Boolean(formik.errors.price)}
          />
          {formik.touched.price && formik.errors.price && (
            <p className="text-red-500 text-sm mt-1">{formik.errors.price}</p>
          )}
        </FormControl>

        <TextField
          label="Description"
          multiline
          rows={4}
          fullWidth
          name="description"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.description}
          error={formik.touched.description && Boolean(formik.errors.description)}
          helperText={formik.touched.description && formik.errors.description}
        />

        <LocationDropdown onLocationSelect={(selectedLocation) => setLocation(selectedLocation)} />

        <TextField
          label="Availability"
          variant="outlined"
          fullWidth
          name="availability"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.availability}
          error={formik.touched.availability && Boolean(formik.errors.availability)}
          helperText={formik.touched.availability && formik.errors.availability}
        />

        <TextField
          label="Bedrooms"
          type="number"
          variant="outlined"
          fullWidth
          name="bedrooms"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.bedrooms}
          error={formik.touched.bedrooms && Boolean(formik.errors.bedrooms)}
          helperText={formik.touched.bedrooms && formik.errors.bedrooms}
        />

        <TextField
          label="Bathrooms"
          type="number"
          variant="outlined"
          fullWidth
          name="bathrooms"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.bathrooms}
          error={formik.touched.bathrooms && Boolean(formik.errors.bathrooms)}
          helperText={formik.touched.bathrooms && formik.errors.bathrooms}
        />

        <TextField
          label="Amenities"
          multiline
          rows={4}
          fullWidth
          name="amenities"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.amenities}
          error={formik.touched.amenities && Boolean(formik.errors.amenities)}
          helperText={formik.touched.amenities && formik.errors.amenities}
        />

        <TextField
          label="Policies"
          multiline
          rows={4}
          fullWidth
          name="policies"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.policies}
          error={formik.touched.policies && Boolean(formik.errors.policies)}
          helperText={formik.touched.policies && formik.errors.policies}
        />

        <Button
          type="submit"
          variant="contained"
          disabled={!formik.isValid || !formik.dirty}
          className="w-full bg-black p-3 rounded-3xl mt-3 text-white disabled:bg-gray-200"
        >
          Submit Listing
        </Button>
      </form>
    </Box>
  );
}