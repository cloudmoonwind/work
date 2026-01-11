module.exports = async function (req, res) {
  const { code } = req.query;

  if (!code) {
    res.statusCode = 400;
    res.end("No code provided");
    return;
  }

  const client_id = process.env.OAUTH_CLIENT_ID;
  const client_secret = process.env.OAUTH_CLIENT_SECRET;

  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
  
  // 1. 请求 access_token
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
  const token = data.access_token;

  if (!token) {
    res.statusCode = 500;
    res.end("No token received from GitHub");
    return;
  }

  // 2. 返回 HTML，让 popup 能通过 postMessage 传给父窗口
  res.setHeader("Content-Type", "text/html");
  res.end(`
    <script>
      if (window.opener) {
        window.opener.postMessage({
          type: "authorization:github:success",
          token: "${token}",
          provider: "github"
        }, "*");
        window.close();
      } else {
        document.write("Authorization complete. You can close this window.");
      }
    </script>
  `);
};