import React, { useEffect, useState } from 'react';
import {
    Modal, Stack, Text, Group, Button, TextInput, Select,
    PasswordInput, Switch, Paper, Divider, ScrollArea,
    Table, Alert,
} from '@mantine/core';
import {
    IconUser, IconLock, IconMail, IconShield, IconSelectAll,
    IconAlertCircle, IconDeviceFloppy,
} from '@tabler/icons-react';
import {
    apiGet,
    apiPost,
    apiPut
} from '../../services/api';
import { notifications } from '@mantine/notifications';
import {
    journaliserAction
} from '../../services/journal';
import {
    aPermission
} from '../../services/permissions';
import {
    getUtilisateurConnecte
} from '../../services/session';

const FONCTIONNALITES = [
    { id: 'dashboard', label: '📊 Tableau de bord' },
    { id: 'clients', label: '👥 Clients' },
    { id: 'types_mesures', label: '📏 Types de mesures' },
    { id: 'ventes', label: '💰 Ventes' },
    { id: 'factures_recus', label: '🧾 Factures & Reçus' },
    { id: 'rendezvous', label: '📅 Rendez-vous' },
    { id: 'historique_paiements', label: '💳 Historique paiements' },
    { id: 'articles', label: '📦 Articles' },
    { id: 'matieres', label: '🧵 Matières' },
    { id: 'mouvements_stock', label: '📋 Mouvements stock' },
    { id: 'tailles', label: '📏 Tailles' },
    { id: 'couleurs', label: '🎨 Couleurs' },
    { id: 'textures', label: '🧶 Textures' },
    { id: 'types_tenues', label: '👔 Types de tenues' },
    { id: 'categories_matieres', label: '📁 Catégories matières' },
    { id: 'types_prestations', label: '🔧 Types prestations' },
    { id: 'prestations_realisees', label: '✅ Prestations réalisées' },
    { id: 'depenses', label: '💸 Dépenses' },
    { id: 'bilan', label: '📈 Bilan financier' },
    { id: 'journal', label: '📒 Journal de caisse' },
    { id: 'employes', label: '👷 Employés' },
    { id: 'salaires', label: '💵 Salaires' },
    { id: 'historique_salaires', label: '📜 Historique salaires' },
    { id: 'emprunts', label: '🏦 Emprunts' },
    { id: 'utilisateurs', label: '👤 Utilisateurs' },
    { id: 'atelier', label: '⚙️ Configuration atelier' },
    { id: 'config_serveur', label: '🖥️ Configuration serveur' },
    { id: 'import_export', label: '📥 Import/Export' },
    { id: 'journal_modifications', label: '📝 Journal modifications' },
    { id: 'aide', label: '❓ Guide utilisation' },
    { id: 'support', label: '🆘 Support technique' },
    { id: 'export_support', label: '📤 Export support' },
];

interface Props {
    utilisateur?: any;
    onSuccess: () => void;
    onCancel: () => void;
}

const normaliserRole = (nom: string) => {
    return nom
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_');
};


const FormulaireUtilisateur: React.FC<Props> = ({ utilisateur, onSuccess, onCancel }) => {
    const [nom, setNom] = useState(utilisateur?.nom || '');
    const [login, setLogin] = useState(utilisateur?.login || '');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState(utilisateur?.role || 'couturier');
    const [loading, setLoading] = useState(false);
    const [permissions, setPermissions] = useState<Record<string, { lecture: boolean; ecriture: boolean }>>({});
    const [newRoleName, setNewRoleName] = useState('');
    const [customRoles, setCustomRoles] = useState<string[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const [loadingPermissions, setLoadingPermissions] = useState(false);

    // Charger tous les rôles personnalisés existants dans la base
    const loadCustomRoles = async () => {
        setLoadingRoles(true);
        try {
            const roles = await apiGet("/utilisateurs/roles");
            // Si les rôles sont un tableau de strings, les utiliser directement
            if (Array.isArray(roles) && roles.length > 0 && typeof roles[0] === 'string') {
                setCustomRoles(roles);
            }
            // Si les rôles sont un tableau d'objets avec value/label
            else if (Array.isArray(roles) && roles.length > 0 && roles[0].value) {
                setCustomRoles(roles.map((r: any) => r.value));
            }
        } catch (error) {
            console.error('Erreur chargement rôles:', error);
        } finally {
            setLoadingRoles(false);
        }
    };

    // Charger les permissions de l'utilisateur si en modification
    const loadPermissions = async (userId: number) => {
        setLoadingPermissions(true);
        try {
            const perms = await apiGet(`/utilisateurs/${userId}/permissions`);
            const map: Record<string, { lecture: boolean; ecriture: boolean }> = {};
            FONCTIONNALITES.forEach(f => {
                const p = perms.find((x: any) => x.fonctionnalite === f.id);
                map[f.id] = {
                    lecture: p?.lecture === 1 || p?.peut_voir === 1,
                    ecriture: p?.ecriture === 1 || p?.peut_modifier === 1
                };
            });
            setPermissions(map);
        } catch (error) {
            console.error('Erreur chargement permissions:', error);
        } finally {
            setLoadingPermissions(false);
        }
    };

    // Initialisation : charger les rôles personnalisés
    useEffect(() => {
        loadCustomRoles();
    }, []);

    // Si modification, charger les permissions
    useEffect(() => {
        if (utilisateur?.id) {
            loadPermissions(utilisateur.id);
        } else if (role === 'admin') {
            // Pour un nouvel admin, cocher toutes les permissions
            const allPermissions: Record<string, { lecture: boolean; ecriture: boolean }> = {};
            FONCTIONNALITES.forEach(f => {
                allPermissions[f.id] = { lecture: true, ecriture: true };
            });
            setPermissions(allPermissions);
        }
    }, [utilisateur, role]);

    const togglePermission = (fonctionnalite: string, type: 'lecture' | 'ecriture') => {
        setPermissions(prev => ({
            ...prev,
            [fonctionnalite]: {
                ...prev[fonctionnalite],
                [type]: !prev[fonctionnalite]?.[type],
            },
        }));
    };

    // Fonction pour tout cocher (lecture + écriture)
    const toutCocher = () => {
        const allPermissions: Record<string, { lecture: boolean; ecriture: boolean }> = {};
        FONCTIONNALITES.forEach(f => {
            allPermissions[f.id] = { lecture: true, ecriture: true };
        });
        setPermissions(allPermissions);
        notifications.show({
            title: '✅ Succès',
            message: 'Toutes les permissions ont été activées',
            color: 'green'
        });
    };

    // Fonction pour tout décocher
    const toutDecocher = () => {
        const allPermissions: Record<string, { lecture: boolean; ecriture: boolean }> = {};
        FONCTIONNALITES.forEach(f => {
            allPermissions[f.id] = { lecture: false, ecriture: false };
        });
        setPermissions(allPermissions);
        notifications.show({
            title: '✅ Succès',
            message: 'Toutes les permissions ont été désactivées',
            color: 'blue'
        });
    };

    // Fonction pour cocher uniquement la lecture pour tous
    const toutCocherLecture = () => {
        const allPermissions: Record<string, { lecture: boolean; ecriture: boolean }> = {};
        FONCTIONNALITES.forEach(f => {
            allPermissions[f.id] = { lecture: true, ecriture: false };
        });
        setPermissions(allPermissions);
        notifications.show({
            title: '✅ Succès',
            message: 'Lecture seule activée pour toutes les fonctionnalités',
            color: 'blue'
        });
    };

    const handleSubmit = async () => {
        if (!nom.trim() || !login.trim()) {
            notifications.show({
                title: 'Erreur',
                message: 'Nom et login requis',
                color: 'red'
            });
            return;
        }

        if (!role) {
            notifications.show({
                title: 'Erreur',
                message: 'Veuillez sélectionner ou créer un rôle',
                color: 'red'
            });
            return;
        }

        // ✅ Normaliser le rôle
        const roleFinal = normaliserRole(role);

        const session = getUtilisateurConnecte();

        if (roleFinal === 'admin' && session?.role !== 'admin') {
            notifications.show({
                title: 'Accès refusé',
                message: 'Seul un administrateur peut créer un administrateur',
                color: 'red'
            });
            return;
        }

        setLoading(true);

        try {
            let userId = utilisateur?.id;

            if (utilisateur) {
                if (utilisateur.role === 'admin' && session?.role !== 'admin') {
                    notifications.show({
                        title: 'Accès refusé',
                        message: 'Seul un administrateur peut modifier un administrateur',
                        color: 'red'
                    });
                    setLoading(false);
                    return;
                }

                await apiPut(`/utilisateurs/${utilisateur.id}`, { nom, login, role: roleFinal });

                await journaliserAction({
                    utilisateur: session?.nom || 'Système',
                    action: 'UPDATE',
                    table: 'utilisateurs',
                    idEnregistrement: String(utilisateur.id),
                    details: `Modification utilisateur : ${nom} (${roleFinal})`
                });

                notifications.show({
                    title: 'Succès',
                    message: 'Utilisateur modifié avec succès',
                    color: 'green'
                });
            } else {
                if (!password) {
                    notifications.show({
                        title: 'Erreur',
                        message: 'Mot de passe requis',
                        color: 'red'
                    });
                    setLoading(false);
                    return;
                }

                if (password.length < 4) {
                    notifications.show({
                        title: 'Erreur',
                        message: 'Le mot de passe doit contenir au moins 4 caractères',
                        color: 'red'
                    });
                    setLoading(false);
                    return;
                }

                const existing = await apiGet(`/utilisateurs/check-login/${login}`);
                if (existing.exists) {
                    notifications.show({
                        title: 'Erreur',
                        message: 'Ce login existe déjà',
                        color: 'red'
                    });
                    setLoading(false);
                    return;
                }

                const result = await apiPost("/utilisateurs", {
                    nom,
                    login,
                    mot_de_passe: password,
                    role: roleFinal // ✅ Rôle normalisé
                });

                userId = result.id;

                await journaliserAction({
                    utilisateur: session?.nom || 'Système',
                    action: 'CREATE',
                    table: 'utilisateurs',
                    idEnregistrement: String(userId),
                    details: `Création utilisateur : ${nom} (${roleFinal})`
                });

                notifications.show({
                    title: 'Succès',
                    message: 'Utilisateur créé avec succès',
                    color: 'green'
                });
            }

            if (userId) {
                const permsArray = Object.entries(permissions).map(([key, val]) => ({
                    fonctionnalite: key,
                    lecture: val.lecture ? 1 : 0,
                    ecriture: val.ecriture ? 1 : 0
                }));

                await apiPut(`/utilisateurs/${userId}/permissions`, { permissions: permsArray });

                await journaliserAction({
                    utilisateur: session?.nom || 'Système',
                    action: 'UPDATE',
                    table: 'permissions',
                    idEnregistrement: String(userId),
                    details: `Mise à jour permissions : ${nom}`
                });
            }

            onSuccess();
        } catch (err: any) {
            console.error('ERREUR:', err);
            notifications.show({
                title: 'Erreur',
                message: err.message || String(err),
                color: 'red'
            });
        } finally {
            setLoading(false);
        }
    };
    const getRoleOptions = () => {
        const baseOptions = [
            { value: 'admin', label: '🔑 Admin - Accès total' },
            { value: 'caissier', label: '💵 Caissier - Gestion des ventes' },
            { value: 'couturier', label: '🧵 Couturier - Production' },
        ];

        // Ajouter les rôles personnalisés
        customRoles.forEach(r => {
            const roleValue = r.toLowerCase();
            if (!baseOptions.some(opt => opt.value === roleValue)) {
                baseOptions.push({ value: roleValue, label: `👤 ${r}` });
            }
        });

        // Si le rôle actuel de l'utilisateur n'est pas dans la liste, on l'ajoute
        if (utilisateur?.role && !baseOptions.some(opt => opt.value === utilisateur.role)) {
            baseOptions.push({ value: utilisateur.role, label: `👤 ${utilisateur.role}` });
        }

        baseOptions.push({ value: 'autre', label: '+ Créer un nouveau rôle' });
        return baseOptions;
    };

    // Compter les permissions actives
    const totalPermissions = FONCTIONNALITES.length;
    const permissionsLectureActives = Object.values(permissions).filter(p => p?.lecture).length;
    const permissionsEcritureActives = Object.values(permissions).filter(p => p?.ecriture).length;

    if (!aPermission('utilisateurs')) {
        return null;
    }

    return (
        <Modal
            opened={true}
            onClose={onCancel}
            title={
                <Group gap="sm">
                    <IconShield size={24} color="#1b365d" />
                    <Text fw={700} size="xl">{utilisateur ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}</Text>
                </Group>
            }
            size="xl"
            centered
            radius="md"
            padding="xl"
        >
            <Stack gap="lg">
                {/* Alert info */}
                <Alert color="blue" variant="light" icon={<IconAlertCircle size={16} />}>
                    <Text size="sm">
                        {utilisateur
                            ? "Modifiez les informations de l'utilisateur et ses permissions d'accès."
                            : "Créez un nouvel utilisateur et définissez ses permissions d'accès."}
                    </Text>
                </Alert>

                {/* Informations générales */}
                <Paper p="md" withBorder radius="md">
                    <Text fw={600} size="sm" mb="md" c="blue">📋 Informations générales</Text>
                    <Group grow>
                        <TextInput
                            label="Nom complet"
                            placeholder="Nom de l'utilisateur"
                            value={nom}
                            onChange={(e) => setNom(e.target.value)}
                            leftSection={<IconUser size={16} />}
                            size="md"
                            radius="md"
                            required
                        />
                        <TextInput
                            label="Login"
                            placeholder="Identifiant de connexion"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                            leftSection={<IconMail size={16} />}
                            size="md"
                            radius="md"
                            required
                        />
                    </Group>

                    <Group grow mt="md">
                        {!utilisateur && (
                            <PasswordInput
                                label="Mot de passe"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                leftSection={<IconLock size={16} />}
                                size="md"
                                radius="md"
                                required
                                description="Minimum 4 caractères"
                            />
                        )}
                        <Select
                            label="Rôle"
                            placeholder="Sélectionnez un rôle"
                            data={getRoleOptions()}
                            value={role}
                            onChange={(val) => {
                                if (val === 'autre') {
                                    setRole('');
                                } else {
                                    setRole(val || 'couturier');
                                    if (val === 'admin') {
                                        toutCocher();
                                    }
                                }
                            }}
                            size="md"
                            radius="md"
                            disabled={loadingRoles}
                        />
                        {role === '' && (
                            <Group gap="xs" mt="md">
                                <TextInput
                                    placeholder="Nom du nouveau rôle"
                                    value={newRoleName}
                                    onChange={(e) => setNewRoleName(e.target.value)}
                                    size="sm"
                                    radius="md"
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    size="sm"
                                    variant="light"
                                    color="green"
                                    onClick={() => {
                                        if (!newRoleName.trim()) {
                                            notifications.show({ title: 'Erreur', message: 'Nom requis', color: 'red' });
                                            return;
                                        }
                                        const newRole = normaliserRole(newRoleName.trim());
                                        setCustomRoles(prev => [...new Set([...prev, newRole])]);
                                        setRole(newRole);
                                        setNewRoleName('');
                                        notifications.show({ title: 'Succès', message: `Rôle "${newRole}" ajouté`, color: 'green' });
                                    }}
                                >
                                    Créer
                                </Button>
                            </Group>
                        )}
                    </Group>
                </Paper>

                <Divider label={<Text fw={600} size="sm">🔐 Permissions d'accès</Text>} labelPosition="center" />

                {/* Barre d'actions pour les permissions */}
                <Paper p="xs" withBorder radius="md" bg="gray.0">
                    <Group justify="space-between">
                        <Group gap="xs">
                            <Text size="xs" c="dimmed">
                                📊 {permissionsLectureActives}/{totalPermissions} lectures • ✏️ {permissionsEcritureActives}/{totalPermissions} écritures
                            </Text>
                        </Group>
                        <Group gap="xs">
                            <Button
                                size="xs"
                                variant="light"
                                color="blue"
                                leftSection={<IconSelectAll size={14} />}
                                onClick={toutCocher}
                            >
                                Tout cocher
                            </Button>
                            <Button
                                size="xs"
                                variant="light"
                                color="yellow"
                                onClick={toutCocherLecture}
                            >
                                Lecture seule
                            </Button>
                            <Button
                                size="xs"
                                variant="light"
                                color="gray"
                                onClick={toutDecocher}
                            >
                                Tout décocher
                            </Button>
                        </Group>
                    </Group>
                </Paper>

                <Paper p="sm" withBorder radius="md">
                    <ScrollArea h={400}>
                        <Table striped highlightOnHover style={{ fontSize: 13 }}>
                            <Table.Thead style={{ backgroundColor: '#1b365d', position: 'sticky', top: 0, zIndex: 1 }}>
                                <Table.Tr>
                                    <Table.Th style={{ color: 'white', padding: '10px' }}>Fonctionnalité</Table.Th>
                                    <Table.Th style={{ color: 'white', padding: '10px', width: 100, textAlign: 'center' }}>Lire</Table.Th>
                                    <Table.Th style={{ color: 'white', padding: '10px', width: 100, textAlign: 'center' }}>Écrire</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {FONCTIONNALITES.map(f => (
                                    <Table.Tr key={f.id}>
                                        <Table.Td style={{ padding: '8px 10px' }}>
                                            <Text size="sm">{f.label}</Text>
                                        </Table.Td>
                                        <Table.Td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                            <Switch
                                                size="sm"
                                                checked={permissions[f.id]?.lecture || false}
                                                onChange={() => togglePermission(f.id, 'lecture')}
                                            />
                                        </Table.Td>
                                        <Table.Td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                            <Switch
                                                size="sm"
                                                checked={permissions[f.id]?.ecriture || false}
                                                onChange={() => togglePermission(f.id, 'ecriture')}
                                                disabled={!permissions[f.id]?.lecture}
                                            />
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </ScrollArea>
                </Paper>

                {loadingPermissions && (
                    <Text size="xs" c="dimmed" ta="center">Chargement des permissions...</Text>
                )}

                <Group justify="flex-end" gap="sm" mt="md">
                    <Button variant="light" size="md" onClick={onCancel} radius="md">
                        Annuler
                    </Button>
                    <Button
                        size="md"
                        onClick={handleSubmit}
                        loading={loading}
                        radius="md"
                        leftSection={<IconDeviceFloppy size={18} />}
                        style={{ backgroundColor: '#1b365d' }}
                    >
                        {utilisateur ? 'Enregistrer les modifications' : 'Créer l\'utilisateur'}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default FormulaireUtilisateur;