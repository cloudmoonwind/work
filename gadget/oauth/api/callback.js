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
        
        // 使用 setInterval 持续发送消息，确保主窗口能收到
        const interval = setInterval(() => {
            if (window.opener) {
                window.opener.postMessage(msg, "*");
            } else {
                clearInterval(interval);
                document.body.innerHTML = '<h2 style="color:red">错误：与主窗口失去连接</h2><p>window.opener 为 null。这通常是因为浏览器安全策略或是在新标签页中打开了此链接。</p>';
            }
        }, 200);

        // 3秒后停止发送并关闭窗口
        setTimeout(() => { 
            // 只有在连接正常的情况下才自动关闭
            if (window.opener) {
                clearInterval(interval);
                window.close();
            }
        }, 3000);
      </script>
      </body>
      </html>
    `);
  } catch (e) {
    res.status(500).send(e.toString());
  }
};