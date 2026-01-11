export default async function handler(req, res) {
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

    // 关键修改：先转义 token，避免模板字符串冲突
    const tokenData = JSON.stringify({
      token: data.access_token,
      provider: "github"
    });

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>验证成功</title>
      </head>
      <body>
      <p>验证成功，正在跳转...</p>
      <script>
        const tokenData = ${tokenData};
        const msg = 'authorization:github:success:' + JSON.stringify(tokenData);
        
        if (window.opener) {
          // 发送消息
          window.opener.postMessage(msg, window.location.origin);
          
          // 延迟关闭，确保消息发送成功
          setTimeout(() => {
            window.close();
          }, 500);
        } else {
          document.body.innerHTML = '<h2 style="color:red">错误：无法连接到主窗口</h2>';
        }
      </script>
      </body>
      </html>
    `);
  } catch (e) {
    res.status(500).send(e.toString());
  }
}