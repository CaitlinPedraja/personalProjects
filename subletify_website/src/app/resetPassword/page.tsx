"use client";

import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Button, TextField, Typography, Container, Box } from '@mui/material';
import { useRouter } from 'next/navigation';


const validationSchema = Yup.object({
  email: Yup.string().email('Invalid email address').required('Email is required')
});

const ResetPasswordPage = () => {
    const router = useRouter();

  const formik = useFormik({
    initialValues: {
      email: ''
    },
    validationSchema,
    onSubmit: async (values) => {
      const res = await fetch("http://localhost:3000/api/user/reset-password", {
        method: "POST",
        body: JSON.stringify(values),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        formik.resetForm();
        alert("Email has been sent");
      } else {
        const error = await res.json();
        alert(error.error);
      }
    },
  });

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ mt: 8 }}>
        <Typography component="h1" variant="h5">
          Reset Password
        </Typography>
        <form onSubmit={formik.handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Email Address"
            autoComplete="email"
            {...formik.getFieldProps('email')}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3 }}>
            Reset Password
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default ResetPasswordPage;
