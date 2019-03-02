const baseUrl = process.env.BASE_URL || "http://localhost:4000";

const config = {
  client_id: process.env.CLIENT_ID || 'i7rgaquwvcg9e9a5scx2ymkttlrzs4',
  client_secret: process.env.CLIENT_SECRET || 'qes8dxe7wpzha34hxi3p7sbi7xb7up',
  base_url: baseUrl,
  redirect_uri: `${process.env.REDIRECT_URI || baseUrl}/authorize`,
  grant_type: 'authorization_code',
  secret: 'somerandomstringsecretshouldgohere'
};

module.exports = config;