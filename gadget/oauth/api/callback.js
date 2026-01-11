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
        const msg = 'authorization:github:success:' + JSON.stringify({
            token: "${data.access_token}",
            provider: "github"
          });
        
        function sendMessage() {
          if (window.opener) {
            window.opener.postMessage(msg, "*");
          } else {
            document.body.innerHTML = "错误：无法找到主窗口 (window.opener is null)，请手动关闭此页面并重试。";
          }
        }

        // 立即发送一次
        sendMessage();
        // 0.5秒后再发送一次，防止主窗口没准备好
        setTimeout(sendMessage, 500);
        // 1.5秒后关闭窗口
        setTimeout(() => { window.close(); }, 3000);
      </script>
      </body>
      </html>
    `);
  } catch (e) {
    res.status(500).send(e.toString());
  }
};