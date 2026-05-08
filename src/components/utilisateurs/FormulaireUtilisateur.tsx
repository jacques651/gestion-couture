import React, { useEffect, useState } from 'react';
import {
    Modal, Stack, Text, Group, Button, TextInput, Select,
    PasswordInput, Switch, Paper, Divider, ScrollArea,
    Table,
} from '@mantine/core';
import {
    IconUser, IconLock, IconMail, IconShield, IconCheck,
} from '@tabler/icons-react';
import { getDb, savePermissions, getPermissions } from '../../database/db';
import { notifications } from '@mantine/notifications';
import bcrypt from 'bcryptjs';
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
    { id: 'ventes', label: '💰 Ventes' },
    { id: 'articles', label: '📦 Articles' },
    { id: 'matieres', label: '🧵 Matières' },
    { id: 'mouvements_stock', label: '📋 Mouvements stock' },
    { id: 'tailles', label: '📏 Tailles' },
    { id: 'couleurs', label: '🎨 Couleurs' },
    { id: 'textures', label: '🧶 Textures' },
    { id: 'modeles_tenues', label: '👔 Modèles' },
    { id: 'categories_matieres', label: '📁 Catégories' },
    { id: 'types_prestations', label: '🔧 Prestations' },
    { id: 'depenses', label: '💸 Dépenses' },
    { id: 'bilan', label: '📈 Bilan' },
    { id: 'journal', label: '📒 Journal' },
    { id: 'employes', label: '👷 Employés' },
    { id: 'salaires', label: '💵 Salaires' },
    { id: 'emprunts', label: '🏦 Emprunts' },
    { id: 'utilisateurs', label: '👤 Utilisateurs' },
    { id: 'atelier', label: '⚙️ Atelier' },
];

interface Props {
    utilisateur?: any;
    onSuccess: () => void;
    onCancel: () => void;
}

const FormulaireUtilisateur: React.FC<Props> = ({ utilisateur, onSuccess, onCancel }) => {
    const [nom, setNom] = useState(utilisateur?.nom || '');
    const [login, setLogin] = useState(utilisateur?.login || '');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState(utilisateur?.role || 'couturier');
    const [loading, setLoading] = useState(false);
    const [permissions, setPermissions] = useState<Record<string, { lecture: boolean; ecriture: boolean }>>({});
    const [newRoleName, setNewRoleName] = useState('');
    const [customRoles, setCustomRoles] = useState<string[]>([]);

    // Charger tous les rôles personnalisés existants dans la base
    const loadCustomRoles = async () => {
        try {
            const db = await getDb();
            const roles = await db.select<any[]>(
                `SELECT DISTINCT role FROM utilisateurs WHERE role NOT IN ('admin', 'caissier', 'couturier')`
            );
            const rolesList = roles.map(r => r.role);
            setCustomRoles(rolesList);
        } catch (error) {
            console.error('Erreur chargement rôles:', error);
        }
    };

    // Charger les permissions de l'utilisateur si en modification
    const loadPermissions = async (userId: number) => {
        const perms = await getPermissions(userId);
        const map: Record<string, { lecture: boolean; ecriture: boolean }> = {};
        FONCTIONNALITES.forEach(f => {
            const p = perms.find((x: any) => x.fonctionnalite === f.id);
            map[f.id] = { lecture: p?.lecture === 1, ecriture: p?.ecriture === 1 };
        });
        setPermissions(map);
    };

    // Initialisation : charger les rôles personnalisés
    useEffect(() => {
        loadCustomRoles();
    }, []);

    // Si modification, charger les permissions
    useEffect(() => {
        if (utilisateur?.id) {
            loadPermissions(utilisateur.id);
        }
    }, [utilisateur]);

    const togglePermission = (fonctionnalite: string, type: 'lecture' | 'ecriture') => {
        setPermissions(prev => ({
            ...prev,
            [fonctionnalite]: {
                ...prev[fonctionnalite],
                [type]: !prev[fonctionnalite]?.[type],
            },
        }));
    };

    const handleSubmit = async () => {
        if (!nom.trim() || !login.trim()) {
            notifications.show({ title: 'Erreur', message: 'Nom et login requis', color: 'red' });
            return;
        }
        if (!role) {

            const session =
                getUtilisateurConnecte();

            if (
                role === 'admin' &&
                session?.role !== 'admin'
            ) {

                notifications.show({
                    title: 'Accès refusé',
                    message:
                        'Seul un administrateur peut créer un administrateur',
                    color: 'red'
                });

                return;
            }
            notifications.show({ title: 'Erreur', message: 'Veuillez sélectionner ou créer un rôle', color: 'red' });
            return;
        }
        setLoading(true);
        try {
            const db = await getDb();
            let userId = utilisateur?.id;

            if (utilisateur) {
                // MODIFICATION

                const session =
                    getUtilisateurConnecte();

                if (
                    utilisateur.role === 'admin' &&
                    session?.role !== 'admin'
                ) {

                    notifications.show({
                        title: 'Accès refusé',
                        message:
                            'Seul un administrateur peut modifier un administrateur',
                        color: 'red'
                    });

                    setLoading(false);

                    return;
                }
                await db.execute(
                    `UPDATE utilisateurs SET nom=?, login=?, role=? WHERE id=?`,
                    [nom, login, role, utilisateur.id]
                );

                // Journalisation modification utilisateur
                await journaliserAction({
                    utilisateur: 'Utilisateur',
                    action: 'UPDATE',
                    table: 'utilisateurs',
                    idEnregistrement: utilisateur.id,
                    details:
                        `Modification utilisateur : ${nom} (${role})`
                });

            } else {
                // CRÉATION
                if (!password) {
                    notifications.show({ title: 'Erreur', message: 'Mot de passe requis', color: 'red' });
                    setLoading(false);
                    return;
                }

                // Vérifier si le login existe déjà
                const existing = await db.select<any[]>(
                    `SELECT id FROM utilisateurs WHERE login = ?`,
                    [login]
                );
                if (existing.length > 0) {
                    notifications.show({ title: 'Erreur', message: 'Ce login existe déjà', color: 'red' });
                    setLoading(false);
                    return;
                }

                // Hasher le mot de passe
                const hash = bcrypt.hashSync(password, 10);

                const result = await db.execute(
                    `INSERT INTO utilisateurs (nom, login, mot_de_passe_hash, role, est_actif) VALUES (?, ?, ?, ?, 1)`,
                    [nom, login, hash, role]
                );
                userId = Number(result.lastInsertId);

                // Journalisation création utilisateur
                await journaliserAction({
                    utilisateur: 'Utilisateur',
                    action: 'CREATE',
                    table: 'utilisateurs',
                    idEnregistrement: userId,
                    details:
                        `Création utilisateur : ${nom} (${role})`
                });
            }

            // Sauvegarder les permissions
            if (userId) {
                const permsArray = Object.entries(permissions).map(([key, val]) => ({
                    fonctionnalite: key,
                    lecture: val.lecture,
                    ecriture: val.ecriture,
                }));
                await savePermissions(userId, permsArray);

                // Journalisation permissions
                await journaliserAction({
                    utilisateur: 'Utilisateur',
                    action: 'UPDATE',
                    table: 'permissions',
                    idEnregistrement: userId,
                    details:
                        `Mise à jour permissions : ${nom}`
                });
            }

            notifications.show({ title: 'Succès', message: 'Utilisateur enregistré', color: 'green' });
            onSuccess();
        } catch (err: any) {
            console.error('ERREUR:', err);
            notifications.show({ title: 'Erreur', message: err.message || String(err), color: 'red' });
        } finally { setLoading(false); }
    };

    // Construction des options du select avec le rôle actuel s'il est personnalisé
    const getRoleOptions = () => {
        const baseOptions = [
            { value: 'admin', label: '🔑 Admin' },
            { value: 'caissier', label: '💵 Caissier' },
            { value: 'couturier', label: '🧵 Couturier' },
            ...customRoles.map(r => ({ value: r.toLowerCase(), label: `👤 ${r}` })),
        ];

        // Si le rôle actuel de l'utilisateur (ex: 'gestionnaire') n'est pas dans la liste, on l'ajoute
        if (utilisateur?.role && !['admin', 'caissier', 'couturier'].includes(utilisateur.role)) {
            const roleExists = baseOptions.some(opt => opt.value === utilisateur.role);
            if (!roleExists) {
                baseOptions.push({ value: utilisateur.role, label: `👤 ${utilisateur.role}` });
            }
        }

        baseOptions.push({ value: 'autre', label: '+ Autre (créer)' });
        return baseOptions;
    };

    if (!aPermission('utilisateurs')) {

        return null;
    }
    return (
        <Modal
            opened={true}
            onClose={onCancel}
            title={
                <Group gap="sm">
                    <IconShield size={20} />
                    <Text fw={700}>{utilisateur ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}</Text>
                </Group>
            }
            size="xl"
            centered
            radius="md"
        >
            <Stack gap="md">
                <Group grow>
                    <TextInput
                        label="Nom"
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        leftSection={<IconUser size={16} />}
                        size="sm"
                        radius="md"
                        required
                    />
                    <TextInput
                        label="Login"
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        leftSection={<IconMail size={16} />}
                        size="sm"
                        radius="md"
                        required
                    />
                </Group>

                <Group grow>
                    {!utilisateur && (
                        <PasswordInput
                            label="Mot de passe"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            leftSection={<IconLock size={16} />}
                            size="sm"
                            radius="md"
                            required
                        />
                    )}
                    <Stack gap={4} style={{ flex: 1 }}>
                        <Select
                            label="Rôle"
                            data={getRoleOptions()}
                            value={role}
                            onChange={(val) => {
                                if (val === 'autre') {
                                    setRole('');
                                } else {
                                    setRole(val || 'couturier');
                                }
                            }}
                            size="sm"
                            radius="md"
                        />
                        {role === '' && (
                            <Group gap="xs">
                                <TextInput
                                    placeholder="Nom du nouveau rôle"
                                    value={newRoleName}
                                    onChange={(e) => setNewRoleName(e.target.value)}
                                    size="xs"
                                    radius="md"
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    size="xs"
                                    variant="light"
                                    color="green"
                                    onClick={() => {
                                        if (!newRoleName.trim()) {
                                            notifications.show({ title: 'Erreur', message: 'Nom requis', color: 'red' });
                                            return;
                                        }
                                        const newRole = newRoleName.trim();
                                        setCustomRoles(prev => [...new Set([...prev, newRole])]);
                                        setRole(newRole.toLowerCase());
                                        setNewRoleName('');
                                        notifications.show({ title: 'Succès', message: `Rôle "${newRole}" ajouté`, color: 'green' });
                                    }}
                                >
                                    Créer
                                </Button>
                            </Group>
                        )}
                    </Stack>
                </Group>

                <Divider label={<Text fw={600} size="sm">🔐 Permissions d'accès</Text>} labelPosition="center" />

                <Paper p="sm" withBorder radius="md">
                    <ScrollArea h={350}>
                        <Table striped highlightOnHover style={{ fontSize: 12 }}>
                            <Table.Thead style={{ backgroundColor: '#1b365d', position: 'sticky', top: 0 }}>
                                <Table.Tr>
                                    <Table.Th style={{ color: 'white', padding: '8px' }}>Fonctionnalité</Table.Th>
                                    <Table.Th style={{ color: 'white', padding: '8px', width: 80, textAlign: 'center' }}>Lire</Table.Th>
                                    <Table.Th style={{ color: 'white', padding: '8px', width: 80, textAlign: 'center' }}>Écrire</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {FONCTIONNALITES.map(f => (
                                    <Table.Tr key={f.id}>
                                        <Table.Td style={{ padding: '6px 8px' }}>
                                            <Text size="xs">{f.label}</Text>
                                        </Table.Td>
                                        <Table.Td style={{ padding: '6px 8px', textAlign: 'center' }}>
                                            <Switch
                                                size="xs"
                                                checked={permissions[f.id]?.lecture || false}
                                                onChange={() => togglePermission(f.id, 'lecture')}
                                            />
                                        </Table.Td>
                                        <Table.Td style={{ padding: '6px 8px', textAlign: 'center' }}>
                                            <Switch
                                                size="xs"
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

                <Group justify="flex-end" gap="sm">
                    <Button variant="light" size="sm" onClick={onCancel} radius="md">Annuler</Button>
                    <Button size="sm" onClick={handleSubmit} loading={loading} radius="md" leftSection={<IconCheck size={16} />}>
                        {utilisateur ? 'Modifier' : 'Créer'}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default FormulaireUtilisateur;