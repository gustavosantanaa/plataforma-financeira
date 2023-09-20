const net = require('net');
const readline = require('readline');
const dgram = require('dgram');
const fs = require('fs'); // Importe o módulo fs

const TCP_PORT = 3000;
const UDP_PORT = 4000;
const serverAddress = 'localhost';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Crie um cliente TCP
const tcpClient = new net.Socket();
let username; // Variável para armazenar o nome de usuário
let fullName;
let email;
let phoneNumber;
let preference;

// Crie um cliente UDP
const udpClient = dgram.createSocket('udp4');

// Função para enviar a preferência via UDP e encerrar a conexão
function sendPreferenceAndClose(preference) {
  udpClient.send(
    Buffer.from(`Interesse:${username}:${preference}`),
    UDP_PORT,
    serverAddress,
    (error) => {
      if (error) {
        console.error('Erro ao enviar preferência via UDP:', error);
      } else {
        console.log('Preferência enviada com sucesso via UDP.');
      }

      // Feche a conexão TCP e o cliente UDP
      tcpClient.end();
      udpClient.close();
      rl.close();
    }
  );
}

tcpClient.connect(TCP_PORT, serverAddress, () => {
  console.log('Conectado ao servidor TCP.');

  rl.question('Digite "login" para entrar ou "sair" para encerrar: ', (data) => {
    if (data.toLowerCase() === 'sair') {
      tcpClient.end();
      udpClient.close();
      rl.close();
    } else if (data.toLowerCase() === 'login') {
      rl.question('Nome de usuário: ', (user) => {
        rl.question('Senha: ', (password) => {
          username = user; // Defina o nome de usuário aqui
          const loginData = `Login:${user}:${password}`;
          tcpClient.write(loginData);
        });
      });
    } else {
      console.log('Comando inválido.');
      rl.close();
    }
  });
});

tcpClient.on('data', (data) => {
  console.log('Resposta do servidor TCP:', data.toString());
  if (data.toString().includes('Successful')) {
    rl.question('Nome completo: ', (name) => {
      fullName = name;
      rl.question('E-mail: ', (mail) => {
        email = mail;
        rl.question('Número de telefone: ', (phone) => {
          phoneNumber = phone;
          const userData = `Dados Cadastrais:${username}:${fullName}:${email}:${phoneNumber}`;
          tcpClient.write(userData);

          rl.question('Digite sua preferência (Ações ou Câmbio): ', (pref) => {
            preference = pref;
            // Verifique se a preferência é "Ações" ou "Câmbio"
            if (pref.toLowerCase() === 'ações' || pref.toLowerCase() === 'câmbio') {
              sendPreferenceAndClose(pref.toLowerCase());
            } else {
              console.log('Opção inválida. A preferência deve ser "Ações" ou "Câmbio".');
              rl.close();
            }
          });
        });
      });
    });
  }
});

tcpClient.on('close', () => {
  console.log('Conexão com o servidor TCP encerrada.');

  // Após coletar todas as informações do usuário:
  const clienteData = {
    username,
    fullName,
    email,
    phoneNumber,
    preference
  };

  // Leia o conteúdo atual do arquivo cliente_data.json (se existir)
  let existingData = {};

  try {
    const jsonData = fs.readFileSync('cliente_data.json', 'utf-8');
    existingData = JSON.parse(jsonData);
  } catch (error) {
    // Se o arquivo não existe ou não é válido, podemos criar um objeto vazio.
  }

  // Mescle o novo clienteData com os dados existentes
  existingData[username] = clienteData;

  // Salve o objeto existingData no arquivo cliente_data.json
  fs.writeFileSync('cliente_data.json', JSON.stringify(existingData, null, 2));
});
