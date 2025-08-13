"use client";

import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Button, TextField, Typography, Container, Box, Tabs, Tab, Link, CircularProgress, Grid } from '@mui/material';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Image from 'next/image';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .matches(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[Ee][Dd][Uu]$/, 'Email must be a .edu address')
    .required('Email is required'),
  password: Yup.string()
    .max(9, 'Password must be less than 10 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match'),
});

const LoginPage = () => {
  const [value, setValue] = React.useState(0); // 0 for Sign In, 1 for Sign Up
  const [loading, setLoading] = React.useState(false); // Loading state
  const router = useRouter();
  
  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      if (value === 0) { // Sign In
        const res = await signIn("credentials", {
          email: values.email,
          password: values.password,
          callbackUrl: `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/furniture`,
          redirect: false,
        });

        if (res?.ok) {
          router.push('/furniture');
        } else {
          alert("Incorrect Sign in");
        }
      } else { // Sign Up
        let userData = { email: values.email, password: values.password };

        const res = await fetch("http://localhost:3000/api/user/create", {
          method: "POST",
          body: JSON.stringify(userData),
          headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
          const signInRes = await signIn("credentials", {
            email: values.email,
            password: values.password,
            callbackUrl: `${process.env.NEXT_PUBLIC_NEXTAUTH_URL}/setup-profile?isNewUser=true&email=${values.email}`,
            redirect: false,
          });
          
          if (signInRes?.ok) {
            router.push('/setup-profile');
          } else {
            alert('Error signing up, please try again');
          }
        } else {
          alert('Error signing up, please try again');
        }
      }
      setLoading(false);
      formik.resetForm();
    },
  });

  return (
    <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Grid container spacing={2}>
        {/* Logo Section */}
        <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center', alignItems: 'center' }}>
          <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Image
              src="/images/4.png" 
              alt="Login logo"
              width={600} 
              height={600} 
              style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }}
            />
          </Box>
        </Grid>

        {/* Login Form Section */}
        <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Box sx={{ p: 4, width: '100%', maxWidth: '600px' }}>
            <Typography component="h1" variant="h5" align="center" className="text-black">
              {value === 0 ? 'Sign In' : 'Sign Up'}
            </Typography>
            <Tabs value={value} onChange={(event, newValue) => {
              setValue(newValue);
              formik.resetForm();
            }} centered>
              <Tab label="Sign In" />
              <Tab label="Sign Up" />
            </Tabs>
            <form onSubmit={formik.handleSubmit} style={{ width: '100%', marginTop: 16 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email Address"
                autoComplete="email"
                autoFocus
                {...formik.getFieldProps('email')}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                type="password"
                autoComplete="current-password"
                {...formik.getFieldProps('password')}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
              />
              {value === 0 && (
                <Typography align="right" sx={{ color: 'blue', mt: 1 }}>
                  <Link href="/resetPassword" underline="hover">
                    Reset password
                  </Link>
                </Typography>
              )}
              {value === 1 && (
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Confirm Password"
                  type="password"
                  {...formik.getFieldProps('confirmPassword')}
                  error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                  helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                />
              )}
              <Button disabled={loading || !formik.isValid || !formik.dirty || (value === 1 && !formik.touched.confirmPassword)} type="submit" fullWidth variant="contained" className='bg-black p-3 rounded-3xl mt-3'>
                {loading ? <CircularProgress size={24} /> : value === 0 ? 'Sign In' : 'Sign Up'}
              </Button>
            </form>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default LoginPage;
