export default async function handler(req, res) {
  const { code } = req.query;
  const client_id = process.env.OAUTH_CLIENT_ID;
  const client_secret = process.env.OAUTH_CLIENT_SECRET;
  
  if (!code) return res.status(400).send('No code provided');

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ client_id, client_secret, code })
    });
    
    const data = await response.json();
    const token = data.access_token;
    
    const content = `
      <script>
        const receiveMessage = (message) => {
          window.opener.postMessage(
            'authorization:github:success:' + JSON.stringify(message),
            '*'
          );
          window.close();
        };
        receiveMessage({ token: "${token}", provider: "github" });
      </script>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(content);
  } catch (error) {
    res.status(500).send(error.message);
  }
}
