import { MapPin, Phone, Mail, Globe, Calendar } from "lucide-react";
import logoSefaz from "../../assets/ti_sefaz.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-govto mt-auto">
      <div className="w-full px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo e Informações Principais */}
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col items-start space-y-2">
              <div className="p-4">
                <h3 className="text-xl font-bold font-heading text-protocolo-blue mb-1">
                  Sistema de Protocolo Digital
                </h3>
                <p className="text-sm font-medium text-protocolo-blue opacity-80 leading-relaxed">
                  Modernizando a gestão pública através da tecnologia e transparência.
                </p>
              </div>
            </div>
          </div>

          {/* Informações de Contato */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 font-heading">
              Contato
            </h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-gray-700">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  Palmas - TO, Brasil
                </span>
              </div>
              <div className="flex items-center space-x-3 text-gray-700">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  (63) 3218-1000
                </span>
              </div>
              <div className="flex items-center space-x-3 text-gray-700">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  protocolo@to.gov.br
                </span>
              </div>
              <div className="flex items-center space-x-3 text-gray-700">
                <Globe className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  www.to.gov.br
                </span>
              </div>
            </div>
          </div>

          {/* Links Úteis */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 font-heading">
              Links Úteis
            </h4>
            <div className="space-y-2">
              <a 
                href="#" 
                className="block text-sm text-gray-700 hover:text-gray-900 transition-smooth story-link"
              >
                Portal da Transparência
              </a>
              <a 
                href="#" 
                className="block text-sm text-gray-700 hover:text-gray-900 transition-smooth story-link"
              >
                Ouvidoria
              </a>
              <a 
                href="#" 
                className="block text-sm text-gray-700 hover:text-gray-900 transition-smooth story-link"
              >
                Diário Oficial
              </a>
              <a 
                href="#" 
                className="block text-sm text-gray-700 hover:text-gray-900 transition-smooth story-link"
              >
                Legislação
              </a>
              <a 
                href="#" 
                className="block text-sm text-gray-700 hover:text-gray-900 transition-smooth story-link"
              >
                Suporte Técnico
              </a>
            </div>
          </div>
        </div>

        {/* Linha de Separação */}
        <div className="border-t border-gray-200 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2 text-gray-600">
              <img 
                src={logoSefaz} 
                alt="Logo SEFAZ Tocantins"
                className="h-10 w-auto object-contain"
              />
              <span className="text-sm">
                © {currentYear} Governo do Tocantins. Todos os direitos reservados.
              </span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <a 
                href="#" 
                className="hover:text-gray-900 transition-smooth"
              >
                Política de Privacidade
              </a>
              <a 
                href="#" 
                className="hover:text-gray-900 transition-smooth"
              >
                Termos de Uso
              </a>
              <a 
                href="#" 
                className="hover:text-gray-900 transition-smooth"
              >
                Acessibilidade
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;