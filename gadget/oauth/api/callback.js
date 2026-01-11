export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("No code provided");
  }

  const client_id = process.env.OAUTH_CLIENT_ID;
  const client_secret = process.env.OAUTH_CLIENT_SECRET;

  if (!client_id || !client_secret) {
    return res.status(500).send("Missing OAuth env vars");
  }

  try {
    const response = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          client_id,
          client_secret,
          code,
        }),
      }
    );

    const data = await response.json();

    if (!data.access_token) {
      return res.status(500).json(data);
    }

    const token = data.access_token;

    res.setHeader("Content-Type", "text/html");
    res.send(`
      <script>
        window.opener.postMessage(
          {
            type: "authorization:github:success",
            token: "${token}",
            provider: "github"
          },
          "*"
        );
        window.close();
      </script>
    `);
  } catch (err) {
    res.status(500).send(err.toString());
  }
}