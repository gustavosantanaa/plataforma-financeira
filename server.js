const net = require('net');
const dgram = require('dgram');

const TCP_PORT = 3000;
const UDP_PORT = 4000;

// Dados cadastrais dos clientes
const clientData = {};

// Dados de autenticação (nome de usuário e senha)
const validClients = {
  gustavo: '12345', // Adicione mais credenciais, se necessário
};

// Crie um servidor TCP
const tcpServer = net.createServer(handleTCPClient);

// Função para lidar com clientes TCP
function handleTCPClient(socket) {
  console.log('Cliente TCP conectado');

  socket.on('data', (data) => {
    const message = data.toString().trim();
    processTCPMessage(socket, message);
  });

  socket.on('end', () => {
    console.log('Cliente TCP desconectado');
  });
}

// Função para processar mensagens TCP
function processTCPMessage(socket, message) {
  if (message.startsWith('Login:')) {
    const [_, username, password] = message.split(':');
    if (authenticate(username, password)) {
      socket.write('Login Successful');
      // Inicialize os dados cadastrais do cliente
      clientData[username] = {
        username,
        fullName: '',
        email: '',
        phoneNumber: '',
        interest: '', // Inicialmente vazio
      };
    } else {
      socket.write('Login Failed');
    }
  } else if (message.startsWith('Dados Cadastrais:')) {
    const [_, username, nomeCompleto, email, phoneNumber] = message.split(':');
    // Atualize os dados cadastrais do cliente
    clientData[username].nomeCompleto = nomeCompleto;
    clientData[username].email = email;
    clientData[username].phoneNumber = phoneNumber;
    console.log('Dados Cadastrais do Cliente:', clientData[username]);
  } else if (message.startsWith('Interesse:')) {
    const [_, username, interest] = message.split(':');
    // Atualize o interesse do cliente
    clientData[username].interest = interest;
    const financeData = getFinanceDataForUser(username, interest);
    socket.write(financeData);
  }
}

// Função para autenticar os clientes
function authenticate(username, password) {
  return validClients[username] === password;
}

const udpServer = dgram.createSocket('udp4');

udpServer.on('listening', () => {
  const address = udpServer.address();
  console.log(`Servidor UDP está ouvindo na porta ${address.port}`);
});

udpServer.on('message', (message, remote) => {
  const [command, username, interest] = message.toString().trim().split(':');
  if (command === 'Interesse' && username && interest) {
    const financeData = getFinanceDataForUser(username, interest);
    udpServer.send(financeData, remote.port, remote.address, (error) => {
      if (error) {
        console.error('Erro ao enviar dados financeiros via UDP:', error);
      } else {
        console.log('Dados financeiros enviados via UDP:', financeData);
      }
    });
  }
});

udpServer.bind(UDP_PORT);

// Função para obter dados financeiros com base nos interesses do cliente
function getFinanceDataForUser(username, interest) {
  console.log('Recebido username:', username);
  console.log('Recebido interest:', interest);

  if (username in clientData) {
    if (interest && interest.toLowerCase() === 'ações') {
      const teslaPrice = (Math.random() * 1000).toFixed(2); // Gera um número decimal aleatório entre 0 e 1000
      return `Tesla: ${teslaPrice} USD`;
    } else if (interest && interest.toLowerCase() === 'câmbio') {
      const exchangeRate = (1 + Math.random()).toFixed(4); // Gera um número decimal aleatório entre 1 e 2
      return `EUR/USD: ${exchangeRate}`;
    }
  }
  
  
  return 'Nenhum dado financeiro disponível para este cliente.';
}

// Iniciar o servidor TCP
tcpServer.listen(TCP_PORT, () => {
  console.log(`Servidor TCP está ouvindo na porta ${TCP_PORT}`);
});
