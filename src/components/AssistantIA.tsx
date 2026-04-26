import React, { useState, useRef, useEffect } from 'react';
import {
  Stack,
  Card,
  Text,
  Button,
  Group,
  TextInput,
  ScrollArea,
  Avatar,
  Box,
  Paper,
  Popover,
  Badge,
} from '@mantine/core';
import {
  IconRobot,
  IconSend,
  IconX,
  IconMicrophone,
  IconVolume,
  IconTrash,
} from '@tabler/icons-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const ASSISTANT_KNOWLEDGE = {
  // Commandes
  commandes: "Pour créer une commande, allez dans 'Commandes' → 'Nouvelle commande'. Renseignez le client, la désignation, la quantité et le prix unitaire.",
  etat_commande: "Vous pouvez suivre l'état d'une commande dans la liste des commandes. Les états possibles : En attente, En cours, Terminée, Livrée.",
  rendez_vous: "Pour planifier un rendez-vous, éditez une commande et renseignez la date dans le champ 'Rendez-vous'.",
  
  // Clients
  clients: "La gestion des clients se fait dans 'Clients avec Mesures'. Vous pouvez y ajouter, modifier et consulter l'historique des clients.",
  mesures: "Pour ajouter des mesures client, allez dans la fiche client et cliquez sur 'Ajouter des mesures'. Vous pouvez enregistrer plusieurs mesures types.",
  import_clients: "Pour importer des clients depuis Excel, allez dans 'Paramètres' → 'Import Excel clients'. Vous pourrez associer vos colonnes aux champs de l'application.",
  
  // Stock
  stock: "Le stock se gère dans 'Stock & Produits'. Vous pouvez suivre les entrées et sorties de matières premières.",
  alerte_stock: "Les alertes de stock se configurent dans 'Matières' en définissant un 'Seuil d'alerte'.",
  
  // Finances
  paiements: "Les paiements clients s'enregistrent depuis la fiche commande ou dans la section 'Paiements'.",
  factures: "Les factures sont générables automatiquement depuis les commandes payées.",
  salaires: "La gestion des salaires se fait dans 'Finances' → 'Gestion salaires'. Supporte salaire fixe et à la prestation.",
  bilan: "Le bilan financier est accessible dans 'Finances' → 'Bilan'. Vous y trouverez les revenus, dépenses et bénéfices.",
  
  // Employés
  employes: "La gestion des employés se fait dans 'Ressources Humaines' → 'Employés'.",
  prestations: "Les prestations des employés sont enregistrées dans 'Prestations' pour le calcul des salaires.",
  emprunts: "Les emprunts employés se gèrent dans 'Emprunts'. Ils seront déduits automatiquement des salaires.",
  
  // Configuration
  parametres: "Les paramètres de l'atelier (nom, logo, adresse) se configurent dans 'Paramètres' → 'Atelier'.",
  utilisateurs: "La gestion des utilisateurs est réservée à l'administrateur dans 'Paramètres' → 'Utilisateurs'.",
  
  // Outils réseau
  config_reseau: "Pour utiliser l'application sur plusieurs ordinateurs, allez dans 'Paramètres' → 'Configuration réseau'. Vous pourrez partager la base de données sur le réseau.",
  export_config: "Pour exporter la configuration des mesures, allez dans 'Paramètres' → 'Export configuration'. Cela crée un fichier JSON à importer sur un autre ordinateur.",
  import_config: "Pour importer une configuration des mesures, allez dans 'Paramètres' → 'Export configuration' et utilisez le bouton d'import.",
  
  // Support
  support: "Pour toute assistance, utilisez cette même fenêtre de chat. Notre assistant IA est là pour vous aider 24/7.",
  export: "Pour exporter la base de données, allez dans 'Support & Aide' → 'Exporter pour support'.",
  
  // Multi-postes
  multi_postes: "Pour utiliser l'application sur plusieurs ordinateurs, vous avez deux options : 1) Utiliser la configuration réseau pour partager la base en temps réel. 2) Exporter/importer la configuration des mesures pour garder les mêmes réglages.",
  
  // Général
  aide: "Je suis votre assistant virtuel. Posez-moi vos questions sur la gestion de l'atelier de couture !",
  accueil: "Bonjour ! Je suis l'assistant virtuel de Gestion Couture. Je peux vous aider à utiliser l'application. Que souhaitez-vous savoir ?",
};

type IntentKeyword = {
  keywords: string[];
  responseKey: string;
};

const INTENTS: IntentKeyword[] = [
  // Commandes
  { keywords: ['commande', 'créer commande', 'nouvelle commande'], responseKey: 'commandes' },
  { keywords: ['état commande', 'statut commande', 'suivi commande'], responseKey: 'etat_commande' },
  { keywords: ['rendez-vous', 'rdv'], responseKey: 'rendez_vous' },
  
  // Clients
  { keywords: ['client', 'clients'], responseKey: 'clients' },
  { keywords: ['mesure', 'mesures'], responseKey: 'mesures' },
  { keywords: ['import client', 'importer client', 'excel client'], responseKey: 'import_clients' },
  
  // Stock
  { keywords: ['stock', 'matière', 'matières'], responseKey: 'stock' },
  { keywords: ['alerte stock', 'seuil'], responseKey: 'alerte_stock' },
  
  // Finances
  { keywords: ['paiement', 'paiements'], responseKey: 'paiements' },
  { keywords: ['facture', 'factures', 'reçu'], responseKey: 'factures' },
  { keywords: ['salaire', 'salaires', 'paye'], responseKey: 'salaires' },
  { keywords: ['bilan', 'finance', 'compte'], responseKey: 'bilan' },
  
  // Employés
  { keywords: ['employé', 'employés', 'personnel'], responseKey: 'employes' },
  { keywords: ['prestation', 'prestations'], responseKey: 'prestations' },
  { keywords: ['emprunt', 'emprunts', 'avance'], responseKey: 'emprunts' },
  
  // Configuration
  { keywords: ['paramètre', 'paramètres', 'configuration'], responseKey: 'parametres' },
  { keywords: ['utilisateur', 'utilisateurs', 'user'], responseKey: 'utilisateurs' },
  
  // Outils et réseau
  { keywords: ['réseau', 'partage', 'multi poste', 'multi-poste', 'plusieurs pc', 'plusieurs ordinateurs'], responseKey: 'multi_postes' },
  { keywords: ['config réseau', 'configuration réseau', 'base partagée'], responseKey: 'config_reseau' },
  { keywords: ['exporter config', 'export configuration'], responseKey: 'export_config' },
  { keywords: ['importer config', 'import configuration'], responseKey: 'import_config' },
  
  // Support
  { keywords: ['support', 'aide', 'problème', 'assistance'], responseKey: 'support' },
  { keywords: ['export base', 'sauvegarde', 'base de données'], responseKey: 'export' },
  
  // Général
  { keywords: ['bonjour', 'salut', 'hello', 'coucou', 'bonsoir'], responseKey: 'accueil' },
];

const generateResponse = (question: string): string => {
  const lowerQuestion = question.toLowerCase();
  
  for (const intent of INTENTS) {
    for (const keyword of intent.keywords) {
      if (lowerQuestion.includes(keyword.toLowerCase())) {
        return ASSISTANT_KNOWLEDGE[intent.responseKey as keyof typeof ASSISTANT_KNOWLEDGE];
      }
    }
  }
  
  return "Je n'ai pas encore d'information sur ce sujet. Essayez de reformuler votre question ou consultez le guide d'utilisation. Vous pouvez aussi contacter le support technique pour plus d'aide.";
};

const AssistantIA: React.FC = () => {
  const [opened, setOpened] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "👋 Bonjour ! Je m'appelle Jacques KORGO. Je suis le concepteur de l'application Gestion Couture. Je peux vous aider avec :\n\n• La création de commandes\n• La gestion des clients et mesures\n• Les finances et salaires\n• L'import de clients Excel\n• La configuration multi-postes\n• Et bien plus encore !\n\nQue souhaitez-vous savoir ?",
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewport = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (scrollViewport.current) {
      scrollViewport.current.scrollTo({
        top: scrollViewport.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const responseText = generateResponse(userMessage.text);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        text: "🧹 Chat nettoyé. Comment puis-je vous aider ?\n\nPosez-moi vos questions sur :\n• Les commandes et clients\n• Les finances et salaires\n• L'import Excel\n• La configuration multi-postes",
        sender: 'assistant',
        timestamp: new Date(),
      },
    ]);
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = 'fr-FR';
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setTimeout(() => sendMessage(), 100);
      };
      recognition.start();
    } else {
      alert("La reconnaissance vocale n'est pas supportée par votre navigateur. Utilisez Chrome ou Edge.");
    }
  };

  const suggestions = [
    "Comment créer une commande ?",
    "Comment importer des clients Excel ?",
    "Comment configurer le réseau ?",
    "Comment gérer les salaires ?",
  ];

  const togglePopover = () => setOpened(!opened);
  const closePopover = () => setOpened(false);

  return (
    <Box
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1000,
      }}
    >
      <Popover
        width={400}
        position="top-end"
        opened={opened}
        onClose={closePopover}
        trapFocus={false}
      >
        <Popover.Target>
          <Button
            onClick={togglePopover}
            variant="gradient"
            gradient={{ from: '#1b365d', to: '#2a4a7a' }}
            size="lg"
            radius="xl"
            style={{
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
            }}
          >
            <Group gap="xs">
              <IconRobot size={24} />
              <Text fw={600}>Assistant IA</Text>
            </Group>
          </Button>
        </Popover.Target>

        <Popover.Dropdown style={{ padding: 0, overflow: 'hidden', borderRadius: '12px' }}>
          <Card p={0} radius="md" withBorder>
            {/* Header */}
            <Box p="sm" style={{ backgroundColor: '#1b365d' }}>
              <Group justify="space-between">
                <Group gap="xs">
                  <Avatar size="md" radius="xl" bg="blue">
                    <IconRobot size={20} color="white" />
                  </Avatar>
                  <Box>
                    <Text size="sm" fw={600} c="white">Assistant IA</Text>
                    <Text size="xs" c="gray.3">24h/24 - 7j/7</Text>
                  </Box>
                </Group>
                <Group gap="xs">
                  <Badge color="green" variant="light" size="sm">
                    En ligne
                  </Badge>
                  <Button
                    variant="subtle"
                    size="compact-sm"
                    onClick={clearChat}
                    color="gray"
                    style={{ color: 'white' }}
                  >
                    <IconTrash size={16} />
                  </Button>
                  <Button
                    variant="subtle"
                    size="compact-sm"
                    onClick={closePopover}
                    color="gray"
                    style={{ color: 'white' }}
                  >
                    <IconX size={16} />
                  </Button>
                </Group>
              </Group>
            </Box>

            {/* Messages */}
            <ScrollArea h={400} viewportRef={scrollViewport} p="md">
              <Stack gap="md">
                {messages.map((message) => (
                  <Group
                    key={message.id}
                    justify={message.sender === 'user' ? 'flex-end' : 'flex-start'}
                    align="flex-start"
                    wrap="nowrap"
                  >
                    {message.sender === 'assistant' && (
                      <Avatar size="sm" radius="xl" bg="blue">
                        <IconRobot size={12} color="white" />
                      </Avatar>
                    )}
                    <Paper
                      p="xs"
                      radius="md"
                      bg={message.sender === 'user' ? 'blue' : 'gray.1'}
                      style={{
                        maxWidth: '80%',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      <Text size="sm" c={message.sender === 'user' ? 'white' : 'dark'}>
                        {message.text}
                      </Text>
                      <Text size="10px" c={message.sender === 'user' ? 'blue.1' : 'dimmed'} mt={4}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </Paper>
                    {message.sender === 'assistant' && (
                      <Button
                        variant="subtle"
                        size="compact-sm"
                        onClick={() => speakResponse(message.text)}
                        style={{ alignSelf: 'center' }}
                      >
                        <IconVolume size={14} />
                      </Button>
                    )}
                  </Group>
                ))}
                {isTyping && (
                  <Group gap="xs">
                    <Avatar size="sm" radius="xl" bg="blue">
                      <IconRobot size={12} color="white" />
                    </Avatar>
                    <Paper p="xs" radius="md" bg="gray.1">
                      <Group gap="xs">
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                      </Group>
                    </Paper>
                  </Group>
                )}
              </Stack>
            </ScrollArea>

            {/* Suggestions */}
            {messages.length < 3 && (
              <Box p="xs" style={{ borderTop: '1px solid #e9ecef', backgroundColor: '#f8f9fa' }}>
                <Text size="xs" c="dimmed" mb={4}>Suggestions :</Text>
                <Group gap="xs">
                  {suggestions.map((suggestion, index) => (
                    <Badge
                      key={index}
                      variant="light"
                      color="blue"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setInputValue(suggestion);
                        setTimeout(() => sendMessage(), 100);
                      }}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </Group>
              </Box>
            )}

            {/* Input */}
            <Box p="sm" style={{ borderTop: '1px solid #e9ecef' }}>
              <Group gap="xs" align="flex-end">
                <TextInput
                  placeholder="Posez votre question..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  style={{ flex: 1 }}
                  radius="xl"
                  disabled={isTyping}
                />
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={startListening}
                  color={isListening ? 'red' : 'gray'}
                  disabled={isTyping}
                >
                  <IconMicrophone size={18} />
                </Button>
                <Button
                  variant="gradient"
                  gradient={{ from: '#1b365d', to: '#2a4a7a' }}
                  size="sm"
                  onClick={sendMessage}
                  disabled={isTyping || !inputValue.trim()}
                  radius="xl"
                >
                  <IconSend size={16} />
                </Button>
              </Group>
              <Text size="10px" c="dimmed" ta="center" mt={8}>
                Assistant IA - Posez vos questions sur l'application
              </Text>
            </Box>
          </Card>
        </Popover.Dropdown>
      </Popover>

      <style>{`
        .typing-dot {
          width: 6px;
          height: 6px;
          background-color: #888;
          border-radius: 50%;
          animation: typing 1.4s infinite;
        }
        .typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-5px);
            opacity: 1;
          }
        }
      `}</style>
    </Box>
  );
};

export default AssistantIA;