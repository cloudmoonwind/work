module.exports = async function (req, res) {
  const { code } = req.query;

  if (!code) {
    res.status(400).send("No code");
    return;
  }

  const client_id = process.env.OAUTH_CLIENT_ID;
  const client_secret = process.env.OAUTH_CLIENT_SECRET;

  try {
    const r = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ client_id, client_secret, code })
    });

    const data = await r.json();

    if (!data.access_token) {
      res.status(500).send("No access_token");
      return;
    }

    res.setHeader("Content-Type", "text/html");
    res.end(`
      <html>
      <body>
      <p>验证成功，正在跳转...</p>
      <script>
        const msg = 'authorization:github:success:' + JSON.stringify({
            token: "${data.access_token}",
            provider: "github"
          });
        
        // 发送消息给主窗口
        window.opener.postMessage(msg, "*");
        
        // 延迟关闭窗口，确保消息发送成功
        setTimeout(() => { window.close(); }, 800);
      </script>
      </body>
      </html>
    `);
  } catch (e) {
    res.status(500).send(e.toString());
  }
};