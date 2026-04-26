import React, { useState } from 'react';
import { save } from '@tauri-apps/plugin-dialog';
import { readFile, writeFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import { info, error as logError } from '@tauri-apps/plugin-log';
import { Button, Tooltip, Box, Text, Stack, Modal, Alert, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconDownload, IconHelpCircle, IconCheck, IconAlertCircle } from '@tabler/icons-react';

const BoutonSupport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [opened, { open, close }] = useDisclosure(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const exporterPourSupport = async () => {
    try {
      setLoading(true);
      setStatus('idle');
      
      // 📁 Choix du fichier destination
      const cheminDestination = await save({
        title: "Exporter la base pour le support technique",
        filters: [{ name: 'Base de données SQLite', extensions: ['db'] }],
        defaultPath: `SAV_Gestion_Couture_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.db`
      });

      if (!cheminDestination) {
        setLoading(false);
        return;
      }

      // 📥 Lire la base locale (Tauri v2 → baseDir)
      const data = await readFile('gestion-couture.db', {
        baseDir: BaseDirectory.AppData
      });

      // 📤 Écrire vers le fichier choisi
      await writeFile(cheminDestination, data);

      await info("Base exportée avec succès");
      setStatus('success');
      
      // Fermer la modale après 1.5 secondes
      setTimeout(() => {
        close();
        setStatus('idle');
      }, 1500);

    } catch (err: any) {
      console.error(err);
      await logError(`Erreur export support : ${err?.message || err}`);
      setStatus('error');
      setErrorMessage(err?.message || "Une erreur inattendue s'est produite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Tooltip label="Exporter la base de données pour le support technique" position="right" withArrow>
        <Button
          onClick={open}
          variant="light"
          color="gray"
          fullWidth
          leftSection={<IconHelpCircle size={18} />}
          styles={{
            root: {
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateX(5px)',
              },
            },
          }}
        >
          Support technique
        </Button>
      </Tooltip>

      <Modal
        opened={opened}
        onClose={close}
        title="📦 Export pour support technique"
        centered
        size="md"
        radius="md"
        styles={{
          header: {
            backgroundColor: '#1b365d',
            padding: '16px 20px',
            borderBottom: '1px solid #e9ecef',
          },
          title: {
            color: 'white',
            fontWeight: 600,
            fontSize: '1.1rem',
          },
          body: {
            padding: '24px',
          },
        }}
      >
        {status === 'idle' && (
          <Stack gap="lg">
            <Box>
              <Text fw={500} size="md" mb="xs">
                Export de la base de données
              </Text>
              <Text size="sm" c="dimmed">
                Cette opération va exporter l'intégralité de votre base de données dans un fichier .db
              </Text>
            </Box>

            <Alert 
              icon={<IconAlertCircle size={16} />} 
              color="blue" 
              variant="light"
              radius="md"
            >
              <Text size="sm" fw={500}>Informations importantes :</Text>
              <Text size="xs" mt={5}>
                • Le fichier contient toutes vos données (clients, commandes, etc.)<br />
                • Envoyez ce fichier à l'équipe support pour analyse<br />
                • Les données restent confidentielles
              </Text>
            </Alert>

            <Group justify="space-between" mt="md">
              <Button variant="subtle" color="gray" onClick={close}>
                Annuler
              </Button>
              <Button
                onClick={exporterPourSupport}
                loading={loading}
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan' }}
                leftSection={<IconDownload size={18} />}
              >
                {loading ? "Export en cours..." : "Exporter maintenant"}
              </Button>
            </Group>
          </Stack>
        )}

        {status === 'success' && (
          <Stack align="center" gap="md" py="xl">
            <IconCheck size={60} color="green" stroke={1.5} />
            <Text size="lg" fw={600} c="green" ta="center">
              Export réussi !
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              La base de données a été exportée avec succès.<br />
              Vous pouvez maintenant envoyer le fichier au support technique.
            </Text>
          </Stack>
        )}

        {status === 'error' && (
          <Stack align="center" gap="md" py="xl">
            <IconAlertCircle size={60} color="red" stroke={1.5} />
            <Text size="lg" fw={600} c="red" ta="center">
              Erreur lors de l'export
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              {errorMessage || "Une erreur s'est produite. Veuillez réessayer."}
            </Text>
            <Button variant="light" color="gray" onClick={close} mt="md">
              Fermer
            </Button>
          </Stack>
        )}
      </Modal>
    </>
  );
};

export default BoutonSupport;