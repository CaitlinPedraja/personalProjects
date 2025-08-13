"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Box,
  TextField,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  Button,
  Select,
  MenuItem,
  FormControl,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

export default function EditListing() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const MAX_FILE_SIZE = 65 * 1024;

  const formik = useFormik({
    initialValues: {
      price: "",
      description: "",
      condition: "",
      colors: [],
      location: "",
    },
    validationSchema: Yup.object({
      description: Yup.string()
        .min(5, "Description must be at least 5 characters")
        .required("Description is required"),
      price: Yup.number()
        .min(0, "Price must be at least 0")
        .max(500, "Price cannot exceed $500")
        .required("Price is required"),
      condition: Yup.string()
        .min(3, "Condition must be at least 3 characters")
        .required("Condition is required"),
      colors: Yup.array()
        .min(1, "At least one color must be selected")
        .required("Color is required"),
    }),
    onSubmit: async (values) => {
      try {
        const newFilesByteArrays = await convertFilesToByteArray(files);
        const existingImagesByteArrays = imagePreview
          .map((url) => url.split(",")[1])
          .filter((byteArray) => byteArray !== undefined && byteArray !== null);
        const allByteArrays =
          existingImagesByteArrays[0] !== undefined
            ? [...existingImagesByteArrays, ...newFilesByteArrays]
            : newFilesByteArrays;

        const payload = {
          ...values,
          pics: allByteArrays,
        };

        const response = await fetch(`http://localhost:5001/api/furniture/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          router.push("/profile");
        } else {
          console.error("Failed to update listing:", response.statusText);
        }
      } catch (error) {
        console.error("Error updating listing:", error);
      }
    },
  });

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/furniture/${id}`);
        if (response.ok) {
          const data = await response.json();
          formik.setValues({
            price: data.price,
            description: data.description,
            condition: data.condition,
            colors: data.colors,
            location: data.location,
          });
          setImagePreview(data.pics);
        } else {
          console.error("Failed to fetch listing data");
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const selectedFiles = Array.from(event.target.files);
      const oversizedFiles = selectedFiles.filter((file) => file.size > MAX_FILE_SIZE);

      if (oversizedFiles.length > 0) {
        alert(
          `The following files are too large: ${oversizedFiles
            .map((file) => file.name)
            .join(", ")}. Each file must be under 64 KB.`
        );
        return;
      }

      setFiles((prev) => [...prev, ...selectedFiles]);
      const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
      setImagePreview((prev) => [...prev, ...previewUrls]);
    }
  };

  const convertFilesToByteArray = async (fileList: File[]) => {
    const byteArrays = await Promise.all(
      fileList.map((file) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const byteString = reader.result as string;
            resolve(byteString.split(",")[1]); // Extract base64 part
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      })
    );
    return byteArrays;
  };

  return (
    <Box className="flex flex-wrap md:flex-nowrap gap-16 p-6 w-full max-w-7xl mx-auto bg-white shadow-lg rounded-lg mt-10 border border-gray-200 text-gray-700 mb-10">
      {/* Left Column: Image Preview */}
      <Box className="flex flex-col items-center w-full md:w-1/2 gap-4">
        <h3 className="text-2xl font-semibold">Image Preview</h3>
        <Box className="w-full h-full mt-2">
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
          Upload Image
          <input type="file" hidden onChange={handleFileChange} multiple />
        </Button>
      </Box>

      {/* Right Column: Form */}
      <form onSubmit={formik.handleSubmit} className="flex flex-col items-center gap-4 w-full md:w-1/2">
        <h2 className="text-2xl font-semibold mb-4">Edit Furniture Listing</h2>

        <TextField
          id="outlined-description"
          label="Description"
          variant="outlined"
          name="description"
          fullWidth
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.description}
          error={formik.touched.description && Boolean(formik.errors.description)}
          helperText={formik.touched.description && formik.errors.description}
        />

        <FormControl fullWidth>
          <InputLabel htmlFor="outlined-adornment-price">Price</InputLabel>
          <OutlinedInput
            id="outlined-adornment-price"
            startAdornment={<InputAdornment position="start">$</InputAdornment>}
            label="Price"
            name="price"
            type="number"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.price}
            error={formik.touched.price && Boolean(formik.errors.price)}
          />
        </FormControl>

        <TextField
          id="outlined-condition"
          label="Condition"
          variant="outlined"
          fullWidth
          multiline
          rows={4}
          name="condition"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.condition}
          error={formik.touched.condition && Boolean(formik.errors.condition)}
          helperText={formik.touched.condition && formik.errors.condition}
        />

        <FormControl fullWidth>
          <InputLabel>Colors</InputLabel>
          <Select
            multiple
            value={formik.values.colors}
            onChange={formik.handleChange}
            name="colors"
            renderValue={(selected) => selected.join(", ")}
          >
            {["Red", "Orange", "Yellow", "Green", "Blue", "Purple", "Black", "Grey"].map((color) => (
              <MenuItem key={color} value={color}>
                {color}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          id="outlined-location"
          label="Location"
          variant="outlined"
          name="location"
          fullWidth
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.location}
          error={formik.touched.location && Boolean(formik.errors.location)}
          helperText={formik.touched.location && formik.errors.location}
        />

        <Button type="submit" variant="contained" className="w-full bg-black p-3 rounded-3xl mt-3 text-white">
          Save Changes
        </Button>
      </form>
    </Box>
  );
}
