import Skeleton from "@mui/material/Skeleton";
import Box from "@mui/material/Box";

const ServicesLoading = () => (
  <Box>
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 3,
      }}
    >
      <Skeleton variant="text" width={120} height={40} />
      <Skeleton variant="rounded" width={160} height={36} />
    </Box>
    <Skeleton variant="rounded" width="100%" height={300} />
  </Box>
);

export default ServicesLoading;
