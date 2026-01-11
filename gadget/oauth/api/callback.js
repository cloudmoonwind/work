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
        <h2>验证成功</h2>
        <p id="status">正在发送消息...</p>
        <button onclick="window.close()" style="margin-top: 20px; padding: 10px;">手动关闭窗口</button>
        
        <h3>调试信息：</h3>
        <pre id="debug"></pre>
        
        <script>
          (function() {
            const token = ${tokenJson};
            const debugEl = document.getElementById('debug');
            const statusEl = document.getElementById('status');
            
            function log(msg) {
              console.log(msg);
              debugEl.textContent += msg + '\\n';
            }
            
            log("Token 长度: " + token.length);
            log("Token 前10位: " + token.substring(0, 10) + "...");
            log("window.opener 存在: " + (!!window.opener));
            
            if (!window.opener) {
              statusEl.innerHTML = '<span style="color:red">错误：window.opener 不存在！</span>';
              log("错误：window.opener 为 null");
              return;
            }
            
            // 不要读取 window.opener.origin，直接发送到已知域
            const message = "authorization:github:success:" + JSON.stringify({
              token: token,
              provider: "github"
            });
            
            log("消息长度: " + message.length);
            log("消息前100字符: " + message.substring(0, 100) + "...");
            
            try {
              // 发送到你的 GitHub Pages 域名
              window.opener.postMessage(message, "https://cloudmoonwind.github.io");
              log("✓ 消息已发送到 https://cloudmoonwind.github.io");
              statusEl.innerHTML = '<span style="color:green">消息已发送！请检查主窗口控制台</span>';
              
              // 3秒后自动关闭
              setTimeout(() => {
                log("准备关闭窗口...");
                window.close();
              }, 3000);
              
            } catch (e) {
              log("✗ 发送失败: " + e.message);
              statusEl.innerHTML = '<span style="color:red">发送失败: ' + e.message + '</span>';
            }
            
          })();
        </script>
      </body>
      </html>
    `);
  } catch (e) {
    res.status(500).send(e.toString());
  }
}