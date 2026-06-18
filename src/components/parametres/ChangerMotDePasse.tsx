import React, { useState } from 'react';
import {
  Modal, Stack, Text, Group, Button, PasswordInput,
  Alert, Paper, Divider
} from '@mantine/core';
import { IconLock, IconLockOpen, IconCheck } from '@tabler/icons-react';
import { apiPost } from '../../services/api';
import { notifications } from '@mantine/notifications';
import { getUtilisateurConnecte } from '../../services/session';

interface Props {
  opened: boolean;
  onClose: () => void;
}

const ChangerMotDePasse: React.FC<Props> = ({ opened, onClose }) => {
  const [ancienMotDePasse, setAncienMotDePasse] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!ancienMotDePasse || !nouveauMotDePasse || !confirmationMotDePasse) {
      notifications.show({
        title: '❌ Erreur',
        message: 'Tous les champs sont requis',
        color: 'red'
      });
      return;
    }

    if (nouveauMotDePasse !== confirmationMotDePasse) {
      notifications.show({
        title: '❌ Erreur',
        message: 'Les nouveaux mots de passe ne correspondent pas',
        color: 'red'
      });
      return;
    }

    if (nouveauMotDePasse.length < 4) {
      notifications.show({
        title: '❌ Erreur',
        message: 'Le mot de passe doit contenir au moins 4 caractères',
        color: 'red'
      });
      return;
    }

    if (ancienMotDePasse === nouveauMotDePasse) {
      notifications.show({
        title: '❌ Erreur',
        message: 'Le nouveau mot de passe doit être différent de l\'ancien',
        color: 'red'
      });
      return;
    }

    const user = getUtilisateurConnecte();
    if (!user?.id) {
      notifications.show({
        title: '❌ Erreur',
        message: 'Utilisateur non connecté',
        color: 'red'
      });
      return;
    }

    setLoading(true);
    try {
      await apiPost('/utilisateurs/change-password', {
        userId: user.id,
        ancienMotDePasse,
        nouveauMotDePasse
      });

      notifications.show({
        title: '✅ Succès',
        message: 'Votre mot de passe a été modifié avec succès',
        color: 'green'
      });

      // Réinitialiser les champs
      setAncienMotDePasse('');
      setNouveauMotDePasse('');
      setConfirmationMotDePasse('');
      onClose();
    } catch (err: any) {
      notifications.show({
        title: '❌ Erreur',
        message: err.message || 'Impossible de modifier le mot de passe',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <IconLockOpen size={24} color="#1b365d" />
          <Text fw={700} size="xl">Changer mon mot de passe</Text>
        </Group>
      }
      size="md"
      centered
      radius="md"
      padding="xl"
    >
      <Stack gap="md">
        <Alert color="blue" variant="light" icon={<IconLock size={16} />}>
          <Text size="sm">Pour des raisons de sécurité, choisissez un mot de passe robuste.</Text>
        </Alert>

        <Paper p="md" withBorder radius="md">
          <Stack gap="md">
            <PasswordInput
              label="Ancien mot de passe"
              placeholder="Entrez votre mot de passe actuel"
              value={ancienMotDePasse}
              onChange={(e) => setAncienMotDePasse(e.target.value)}
              size="md"
              radius="md"
              required
            />

            <Divider />

            <PasswordInput
              label="Nouveau mot de passe"
              placeholder="Entrez votre nouveau mot de passe"
              value={nouveauMotDePasse}
              onChange={(e) => setNouveauMotDePasse(e.target.value)}
              size="md"
              radius="md"
              required
            />

            <PasswordInput
              label="Confirmation"
              placeholder="Confirmez votre nouveau mot de passe"
              value={confirmationMotDePasse}
              onChange={(e) => setConfirmationMotDePasse(e.target.value)}
              size="md"
              radius="md"
              required
            />
          </Stack>
        </Paper>

        <Group justify="flex-end" gap="sm" mt="md">
          <Button variant="light" onClick={onClose} size="md" radius="md">
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            loading={loading}
            leftSection={<IconCheck size={18} />}
            style={{ backgroundColor: '#1b365d' }}
            size="md"
            radius="md"
          >
            Modifier le mot de passe
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default ChangerMotDePasse;