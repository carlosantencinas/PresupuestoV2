import React, { useState } from "react";
import { TextField, InputAdornment } from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { debounce } from "lodash";

export default function GlobalSearch({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = debounce((term) => {
    onSearch(term.toLowerCase());
  }, 300);

  return (
    <TextField
      fullWidth
      variant="outlined"
      placeholder="Buscar en todo el proyecto..."
      value={searchTerm}
      onChange={(e) => {
        setSearchTerm(e.target.value);
        handleSearch(e.target.value);
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
      }}
      sx={{ mb: 3 }}
    />
  );
}