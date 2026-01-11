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

    const token = data.access_token;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>验证成功 - 调试模式</title>
      </head>
      <body>
        <h2>验证成功</h2>
        <p id="status">正在发送消息...</p>
        <button onclick="window.close()" style="margin-top: 20px; padding: 10px;">手动关闭窗口</button>
        
        <h3>调试信息：</h3>
        <pre id="debug"></pre>
        
        <script>
          (function() {
            const token = "${token.replace(/"/g, '\\"')}";
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
            
            log("window.opener.origin: " + window.opener.origin);
            
            const message = "authorization:github:success:" + JSON.stringify({
              token: token,
              provider: "github"
            });
            
            log("消息内容: " + message.substring(0, 100) + "...");
            
            try {
              window.opener.postMessage(message, "https://cloudmoonwind.github.io");
              log("✓ 消息已发送到 https://cloudmoonwind.github.io");
              statusEl.innerHTML = '<span style="color:green">消息已发送！请检查主窗口控制台</span>';
            } catch (e) {
              log("✗ 发送失败: " + e.message);
              statusEl.innerHTML = '<span style="color:red">发送失败: ' + e.message + '</span>';
            }
            
            // 也尝试发送到 window.opener.origin
            try {
              window.opener.postMessage(message, window.opener.origin);
              log("✓ 消息已发送到 " + window.opener.origin);
            } catch (e) {
              log("✗ 发送到 opener.origin 失败: " + e.message);
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