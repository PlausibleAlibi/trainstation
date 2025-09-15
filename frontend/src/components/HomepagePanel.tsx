import { Box, Typography } from '@mui/material';

interface HomepagePanelProps {
  imageUrl: string;
  imageAlt: string;
}

export default function HomepagePanel({ imageUrl, imageAlt }: HomepagePanelProps) {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'row',
      alignItems: 'center', 
      justifyContent: 'space-around', 
      minHeight: '60vh',
      gap: 4,
      py: 4,
      px: 2,
      flexWrap: 'wrap'
    }}>
      {/* Image Container - Left side */}
      <Box sx={{
        flex: '0 0 400px',
        maxWidth: 400,
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        background: 'linear-gradient(145deg, #f0f0f0, #ffffff)',
        padding: 2
      }}>
        <img 
          src={imageUrl} 
          alt={imageAlt}
          style={{ 
            width: '100%', 
            height: 'auto',
            borderRadius: '8px',
            display: 'block'
          }}
        />
      </Box>
      
      {/* Text Container - Right side */}
      <Box sx={{
        flex: '1 1 400px',
        textAlign: 'left',
        maxWidth: 600,
        minWidth: 300
      }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{
          fontWeight: 'bold',
          color: 'primary.main',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          fontSize: '3rem'
        }}>
          Welcome to TrainStation!
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{
          lineHeight: 1.6,
          fontStyle: 'italic',
          fontSize: '1.25rem'
        }}>
          Your all-in-one solution for managing model railway accessories, track lines, sections, switches, and connections.
        </Typography>
      </Box>
    </Box>
  );
}