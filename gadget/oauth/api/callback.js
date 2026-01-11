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

    const tokenJson = JSON.stringify(data.access_token);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>验证成功</title>
      </head>
      <body>
        <p>验证成功，请稍候...</p>
        <script>
          (function() {
            const token = ${tokenJson};
            
            if (!window.opener) {
              document.body.innerHTML = '<h2 style="color:red">错误：无法连接到主窗口</h2>';
              return;
            }
            
            const message = "authorization:github:success:" + JSON.stringify({
              token: token,
              provider: "github"
            });
            
            console.log("准备发送消息:", message.substring(0, 100) + "...");
            
            // 关键：使用 "*" 而不是具体域名
            window.opener.postMessage(message, "*");
            
            console.log("消息已发送");
            
            // 延迟关闭，确保消息发送成功
            setTimeout(() => {
              window.close();
            }, 1000);
            
          })();
        </script>
      </body>
      </html>
    `);
  } catch (e) {
    res.status(500).send(e.toString());
  }
}