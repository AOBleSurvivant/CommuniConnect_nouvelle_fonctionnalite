import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import Navigation from './Navigation';

const Layout = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Navigation moderne */}
      <Navigation />
      
      {/* Contenu principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: 2,
          pb: 4,
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Container maxWidth="xl">
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default Layout; 