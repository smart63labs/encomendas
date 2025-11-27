import React, { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Eye, 
  EyeOff, 
  User, 
  Mail, 
  Building2, 
  Phone, 
  Calendar,
  CheckCircle,
  XCircle,
  Loader2,
  Database
} from 'lucide-react';

interface LdapTestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LdapUserInfo {
  dn: string;
  cn: string;
  displayName: string;
  mail: string;
  department: string;
  telephoneNumber: string;
  title: string;
  company: string;
  whenCreated: string;
  whenChanged: string;
  memberOf: string[];
  userAccountControl: string;
  samAccountName: string;
}

const LdapTestModal: React.FC<LdapTestModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    userInfo?: LdapUserInfo;
  } | null>(null);

  const handleTest = async () => {
    if (!email || !password) {
      setTestResult({
        success: false,
        message: 'Por favor, preencha email e senha para o teste.'
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      const response = await api.post('/ldap/test-user-authentication', {
        email,
        password
      });

      const apiPayload = response?.data;
      const success = apiPayload?.success === true;
      const message = apiPayload?.message || (success ? 'Autenticação LDAP realizada com sucesso!' : (apiPayload?.error || 'Falha na autenticação LDAP'));
      const user = apiPayload?.data?.user || null;

      if (success) {
        // Mapear dados mínimos retornados pelo backend para o layout do modal
        const mappedUserInfo = user ? {
          dn: '',
          cn: user.nome || '',
          displayName: user.nome || '',
          mail: user.e_mail || user.email || '',
          department: user.departamento || '',
          telephoneNumber: '',
          title: user.cargo || '',
          company: '',
          whenCreated: '',
          whenChanged: '',
          memberOf: [],
          userAccountControl: '',
          samAccountName: user.login || ''
        } : undefined;

        setTestResult({
          success: true,
          message,
          userInfo: mappedUserInfo
        });
      } else {
        setTestResult({
          success: false,
          message
        });
      }
    } catch (error: any) {
      const backendMsg = error?.response?.data?.error || error?.response?.data?.message;
      setTestResult({
        success: false,
        message: backendMsg || 'Erro ao testar autenticação LDAP'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setTestResult(null);
    onClose();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('pt-BR');
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Teste de Autenticação LDAP
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário de Login */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Credenciais de Teste</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="test-email">Email/Login</Label>
                  <Input
                    id="test-email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@sefaz.to.gov.br"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="test-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleTest} 
                disabled={isLoading || !email || !password}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testando Autenticação...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Testar Autenticação LDAP
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Resultado do Teste */}
          {testResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  Resultado do Teste
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className={`p-3 rounded-lg ${
                    testResult.success 
                      ? 'bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-200' 
                      : 'bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-200'
                  }`}>
                    <p className="font-medium">{testResult.message}</p>
                  </div>

                  {/* Informações do Usuário LDAP */}
                  {testResult.success && testResult.userInfo && (
                    <div className="space-y-4">
                      <Separator />
                      <h4 className="font-semibold text-lg">Informações do Usuário LDAP</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Nome de Exibição</p>
                              <p className="text-sm text-muted-foreground">
                                {testResult.userInfo.displayName || testResult.userInfo.cn || 'N/A'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Email</p>
                              <p className="text-sm text-muted-foreground">
                                {testResult.userInfo.mail || 'N/A'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Departamento</p>
                              <p className="text-sm text-muted-foreground">
                                {testResult.userInfo.department || 'N/A'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Telefone</p>
                              <p className="text-sm text-muted-foreground">
                                {testResult.userInfo.telephoneNumber || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium">Cargo</p>
                            <p className="text-sm text-muted-foreground">
                              {testResult.userInfo.title || 'N/A'}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm font-medium">Empresa</p>
                            <p className="text-sm text-muted-foreground">
                              {testResult.userInfo.company || 'N/A'}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm font-medium">Login (SAM)</p>
                            <p className="text-sm text-muted-foreground">
                              {testResult.userInfo.samAccountName || 'N/A'}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Criado em</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(testResult.userInfo.whenCreated)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* DN e Grupos */}
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium">Distinguished Name (DN)</p>
                          <p className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded">
                            {testResult.userInfo.dn || 'N/A'}
                          </p>
                        </div>

                        {testResult.userInfo.memberOf && testResult.userInfo.memberOf.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">Grupos do Active Directory</p>
                            <div className="flex flex-wrap gap-1">
                              {testResult.userInfo.memberOf.slice(0, 10).map((group, index) => {
                                // Extrair apenas o nome do grupo do DN
                                const groupName = group.split(',')[0].replace('CN=', '');
                                return (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {groupName}
                                  </Badge>
                                );
                              })}
                              {testResult.userInfo.memberOf.length > 10 && (
                                <Badge variant="outline" className="text-xs">
                                  +{testResult.userInfo.memberOf.length - 10} mais
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LdapTestModal;