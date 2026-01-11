module.exports = async function (req, res) {
  const { code } = req.query;

  if (!code) {
    res.statusCode = 400;
    res.end("No code provided");
    return;
  }

  const client_id = process.env.OAUTH_CLIENT_ID;
  const client_secret = process.env.OAUTH_CLIENT_SECRET;

  const response = await fetch(
    "https://github.com/login/oauth/access_token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ client_id, client_secret, code }),
    }
  );

  const data = await response.json();

  res.setHeader("Content-Type", "text/html");
  res.end(`
    <script>
      window.opener.postMessage(
        { token: "${data.access_token}", provider: "github" },
        "*"
      );
      window.close();
    </script>
  `);
};