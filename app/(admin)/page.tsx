import { getSession } from "@/lib/session";
import { getAccountSummary, getDisplayName } from "@/lib/account";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

export const dynamic = "force-dynamic";

const DashboardPage = async () => {
  const session = await getSession();
  if (!session) return null;

  const account = await getAccountSummary(session);
  const displayName = getDisplayName(account, session);

  return (
    <>
      <Typography variant="h2" sx={{ mb: 3 }}>
        Dashboard
      </Typography>

      <Card>
        <CardContent>
          <Typography variant="h3" sx={{ mb: 2 }}>
            Bienvenue, {displayName}
          </Typography>

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
              },
            }}
          >
            <InfoItem label="Prenom" value={account?.first_name} />
            <InfoItem label="Nom" value={account?.last_name} />
            <InfoItem
              label="Email"
              value={account?.email ?? session.email}
            />
            <InfoItem label="Type de compte" value={account?.account_type} />
            <InfoItem
              label="Identifiant"
              value={
                account?.account_id?.toString() ?? session.sub
              }
            />
          </Box>
        </CardContent>
      </Card>
    </>
  );
};

const InfoItem = ({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) => (
  <Box
    sx={{
      p: 1.5,
      borderRadius: 1,
      bgcolor: "background.default",
    }}
  >
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body1" sx={{ mt: 0.5 }}>
      {value ?? "Non renseigne"}
    </Typography>
  </Box>
);

export default DashboardPage;
