import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/hooks/use-notification';
import NotificationModal from '@/components/ui/notification-modal';
import logoSefaz from '@/assets/logo-sefaz-tocantins.png';
import tiSefaz from '@/assets/ti_sefaz.png';
import fundoLogin from '@/assets/fundo_login_3.jpg';
import logoGoverno from '@/assets/NovaLogoGoverno_FundoTransparente.png';

const Login: React.FC = () => {
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Notificação via modal (sem toast)
  const { notification, isOpen, showSuccess, showError, hideNotification } = useNotification();

  const handleNotificationClose = () => {
    hideNotification();
    if (notification?.variant === 'success') {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  };

  // Função para formatar CPF
  const formatCpf = (value: string) => {
    // Remove tudo que não é dígito
    const cleanValue = value.replace(/\D/g, '');

    // Aplica a máscara
    if (cleanValue.length <= 11) {
      return cleanValue
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }

    return cleanValue.slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  // Função para validar CPF
  const validateCpf = (cpf: string) => {
    const cleanCpf = cpf.replace(/\D/g, '');

    if (cleanCpf.length !== 11) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCpf)) return false;

    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.charAt(10))) return false;

    return true;
  };

  // Handler para mudança no campo CPF
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCpf(e.target.value);
    setCpf(formattedValue);
  };

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!cpf || !senha) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    // Validação de CPF
    if (!validateCpf(cpf)) {
      setError('Por favor, insira um CPF válido.');
      return;
    }

    try {
      setIsLoading(true);
      await login({ cpf, senha });
      // O redirecionamento será feito automaticamente pelo useEffect
      // quando isAuthenticated mudar para true
    } catch (error: any) {
      console.error('Erro no login:', error);

      // Verificar se é erro de usuário inativo
      if (error.message && (error.message.includes('Usuário inativo') || error.message.includes('Usuario inativo'))) {
        showError(
          'Acesso Negado',
          'Este usuário está inativo no sistema. Por favor, entre em contato com o administrador.'
        );
        setError(''); // Limpar erro inline se houver
      } else {
        setError(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Painel esquerdo - Boas-vindas (Escondido em mobile) */}
      <div
        className="hidden md:flex flex-1 flex-col justify-center items-center text-white p-12 relative overflow-hidden"
        style={{
          background: `
              linear-gradient(to bottom, 
                #3a372fff 0%, 
                #d3aa42ff 15%, 
                transparent 25%, 
                transparent 75%, 
                #DAA520 85%, 
                #42403bff 100%
              ),
              url(${fundoLogin})
            `,
          backgroundSize: 'cover, contain',
          backgroundPosition: 'center, center',
          backgroundRepeat: 'no-repeat, no-repeat'
        }}
      >
        {/* Overlay para transparência */}
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Logo do Governo no canto superior esquerdo */}
        <div className="absolute top-[220px] left-4 z-50">
          <img
            src={logoGoverno}
            alt="Logo do Governo"
            className="h-30 w-auto object-contain drop-shadow-2xl filter brightness-110 contrast-110"
          />
        </div>

        <div className="absolute bottom-16 left-8 z-20">
          {/* Container com transparência melhorada para o conteúdo */}
          <div className="bg-black/40 backdrop-blur-md rounded-xl p-10 border border-white/30 shadow-2xl max-w-4xl w-full">
            <h1 className="text-5xl font-bold mb-1 text-white drop-shadow-lg leading-tight">
              Sistema de Protocolo Digital
            </h1>
            <p className="text-xl text-white font-medium leading-relaxed drop-shadow-md">
              Modernizando a gestão pública através da tecnologia e transparência.
            </p>
          </div>
        </div>
      </div>

      {/* Efeito de sombreamento na intersecção (Apenas Desktop) */}
      <div className="hidden md:block absolute left-1/2 top-0 h-full w-32 -translate-x-1/2 z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.1) 50%, transparent 100%)'
        }}>
      </div>

      {/* Lado Direito - Formulário de Login */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-8 relative w-full"
        style={{
          background: `
               linear-gradient(135deg, 
                 #fefefe 0%, 
                 #f8f9fa 25%, 
                 #f1f3f4 50%, 
                 #f8f9fa 75%, 
                 #fefefe 100%
               )
             `
        }}>
        {/* Container principal com sombra elegante */}
        <div className="w-full max-w-md bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/50 p-8">
          {/* Logo e Cabeçalho */}
          <div className="text-center mb-8">
            {/* Logo do Governo (Mobile Only) */}
            <div className="flex md:hidden justify-center mb-6">
              <img
                src={logoGoverno}
                alt="Logo Governo"
                className="h-16 object-contain drop-shadow-md"
              />
            </div>

            <div className="flex justify-center items-center mb-6">
              <img
                src={logoSefaz}
                alt="SEFAZ Tocantins"
                className="h-12 drop-shadow-md"
              />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2 tracking-tight">
              Acesso ao Sistema
            </h2>
            <p className="text-sm text-gray-600 font-medium">
              Digite suas credenciais para continuar
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Usuário/CPF */}
            <div className="space-y-2">
              <Label htmlFor="cpf" className="text-sm font-semibold text-gray-700 tracking-wide">
                Usuário
              </Label>
              <Input
                id="cpf"
                type="text"
                placeholder="Digite seu CPF"
                value={cpf}
                onChange={handleCpfChange}
                disabled={isLoading}
                className="h-12 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-300 text-base font-medium placeholder:text-gray-400 shadow-sm hover:shadow-md focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-1 border-gray-200"
                autoComplete="username"
                autoFocus
                maxLength={14}
              />
            </div>

            {/* Campo Senha */}
            <div className="space-y-2">
              <Label htmlFor="senha" className="text-sm font-semibold text-gray-700 tracking-wide">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  disabled={isLoading}
                  className="h-12 pr-12 rounded-xl bg-gray-50/50 backdrop-blur-sm transition-all duration-300 text-base font-medium placeholder:text-gray-400 shadow-sm hover:shadow-md focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-1 border-gray-200"
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  onClick={togglePasswordVisibility}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            {/* Botão de Login */}
            <Button
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          {/* Logo SEFAZ no rodapé */}
          <div className="flex justify-center mt-8">
            <div className="flex items-center space-x-2">
              <img
                src={tiSefaz}
                alt="SEFAZ Tecnologia"
                className="h-12"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de notificação de sucesso */}
      {notification && (
        <NotificationModal
          isOpen={isOpen}
          onClose={handleNotificationClose}
          title={notification.title}
          description={notification.description}
          variant={notification.variant}
        />
      )}
    </div>
  );
};

export default Login;