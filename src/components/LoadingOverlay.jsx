import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

export default function LoadingOverlay({ loading }) {
  if (!loading) return null;

  return (
    <Box sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      color: 'white'
    }}>
      <CircularProgress size={80} color="inherit" />
      <Typography variant="h6" sx={{ mt: 2 }}>
        Procesando archivo...
      </Typography>
    </Box>
  );
}