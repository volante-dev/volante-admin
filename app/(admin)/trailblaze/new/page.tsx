import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import { BlogPostForm } from "@/components/admin/BlogPostForm";

const NewBlogPostPage = async () => (
  <>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
      <Link href="/trailblaze">
        <Button startIcon={<ArrowBackIcon />} size="small">
          Trailblaze
        </Button>
      </Link>
    </Box>
    <Typography variant="h2" sx={{ mb: 3 }}>
      Nouvel article
    </Typography>
    <BlogPostForm />
  </>
);

export default NewBlogPostPage;
