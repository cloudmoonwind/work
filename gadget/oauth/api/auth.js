module.exports = function (req, res) {
  const { host } = req.headers;
  const client_id = process.env.OAUTH_CLIENT_ID;

  if (!client_id) {
    res.statusCode = 500;
    res.end("Missing OAUTH_CLIENT_ID");
    return;
  }

  const redirect_uri = `https://${host}/api/callback`;
  const scope = "repo user";

  const url =
    "https://github.com/login/oauth/authorize" +
    `?client_id=${client_id}` +
    `&redirect_uri=${encodeURIComponent(redirect_uri)}` +
    `&scope=${encodeURIComponent(scope)}`;

  res.writeHead(302, { Location: url });
  res.end();
};