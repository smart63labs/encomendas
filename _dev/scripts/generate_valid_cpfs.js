// Função para gerar CPF válido
function generateValidCPF() {
  // Gera os 9 primeiros dígitos aleatoriamente
  let cpf = '';
  for (let i = 0; i < 9; i++) {
    cpf += Math.floor(Math.random() * 10);
  }
  
  // Calcula o primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  cpf += remainder;
  
  // Calcula o segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  cpf += remainder;
  
  return cpf;
}

// Gera 5 CPFs válidos
console.log('CPFs válidos gerados:');
for (let i = 0; i < 5; i++) {
  const cpf = generateValidCPF();
  console.log(`CPF ${i + 1}: ${cpf}`);
}