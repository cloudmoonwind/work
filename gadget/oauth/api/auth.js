export default function handler(req, res) {
  const { host } = req.headers;

  const client_id = process.env.OAUTH_CLIENT_ID;
  if (!client_id) {
    return res.status(500).send("Missing OAUTH_CLIENT_ID");
  }

  const redirect_uri = `https://${host}/api/callback`;
  const scope = "repo user";

  const url =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${client_id}` +
    `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
    `&scope=${encodeURIComponent(scope)}`;

  res.redirect(url);
}