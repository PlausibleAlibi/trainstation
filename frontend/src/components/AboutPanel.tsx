import { Box, Typography } from '@mui/material';

interface AboutInfo {
  title: string;
  description: string;
  funFact: string;
}

interface AboutPanelProps {
  aboutInfo: AboutInfo;
}

export default function AboutPanel({ aboutInfo }: AboutPanelProps) {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: 3,
      py: 4,
      maxWidth: 800,
      margin: '0 auto'
    }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {aboutInfo.title}
      </Typography>
      <Typography variant="body1" sx={{ textAlign: 'center', mb: 2 }}>
        {aboutInfo.description}
      </Typography>
      <Box sx={{ 
        mt: 4, 
        p: 3, 
        bgcolor: 'grey.50', 
        borderRadius: 2,
        borderLeft: 4,
        borderColor: 'primary.main'
      }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          <strong>Fun Fact:</strong> {aboutInfo.funFact}
        </Typography>
      </Box>
    </Box>
  );
}