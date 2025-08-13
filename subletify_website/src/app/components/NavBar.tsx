"use client";

import * as React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { AppBar, Box, CssBaseline, Divider, IconButton, Drawer, List, ListItem, ListItemButton, ListItemText, Toolbar, Typography, Button } from '@mui/material';
import { handleSignOut } from '../utils/auth/signOutHandler';
import Image from 'next/image';

const drawerWidth = 240;

export default function DrawerAppBar(props: { window?: () => Window }) {
  const { data: session } = useSession();
  const { window } = props;
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen((prevState) => !prevState);
  };

  const isAdmin = session?.user?.email === 'subletify@wustl.edu';

  const baseNavItems = [
    { text: 'Furniture', href: '/furniture' },
    { text: 'Listings', href: '/listings' },
    { text: 'Profile', href: '/profile' },
    { text: 'Messages', href: '/messages' },
    { text: 'Login', href: '/login' },
  ];

  const dynamicNavItems = [
    ...(isAdmin ? [{ text: 'Pending', href: '/admin' }] : []),
    { text: 'Sign Out', href: '#' },
  ];

  const filteredItems = [
    ...baseNavItems.filter((item) => {
      if (item.text === 'Login' && session) return false;
      if ((item.text === 'Profile' || item.text === 'Messages') && !session) return false;
      return true;
    }),
    ...(session ? dynamicNavItems : []),
  ];

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        Subletify
      </Typography>
      <Divider />
      <List>
        {filteredItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <Link href={item.href} passHref>
              <ListItemButton
                sx={{ textAlign: 'center' }}
                onClick={item.text === 'Sign Out' ? handleSignOut : undefined}
              >
                <ListItemText primary={item.text} />
              </ListItemButton>
            </Link>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const container = window !== undefined ? () => window().document.body : undefined;

  return (
    <Box className="flex h-[80px]">
      <CssBaseline />
      <AppBar component="nav" className='h-20 flex justify-center px-4'>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Image
              src="/images/favicon.png"
              alt="Subletify Logo"
              width={50}
              height={50}
              priority
              style={{ marginRight: 8, filter: 'brightness(0) invert(1)' }}
            />
            <div className="hidden sm:block text-3xl font-medium">
              Subletify
            </div>
          </Box>
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 2.5 }}>
            {filteredItems.map((item) => (
              <Button
                key={item.text}
                sx={{
                  color: '#fff',
                  fontSize: '15px', 
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
                onClick={item.text === 'Sign Out' ? handleSignOut : undefined}
              >
                {item.text === 'Sign Out' ? (
                  item.text
                ) : (
                  <Link href={item.href} passHref>
                    {item.text}
                  </Link>
                )}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </AppBar>
      <nav>
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
      </nav>
      <Box component="main" sx={{ p: 3 }}>
        <Toolbar />
      </Box>
    </Box>
  );
}
