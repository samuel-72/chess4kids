import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions, ScrollView } from 'react-native';
import { useAuthStore } from '../stores/authStore';
import { usePathname } from 'expo-router';

// Global log capture
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

let logs: string[] = [];
const MAX_LOGS = 20;

const addLog = (type: 'log' | 'error', args: any[]) => {
    const message = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
    logs = [`[${type.toUpperCase()}] ${message}`, ...logs].slice(0, MAX_LOGS);
};

// Monkey patch console (only once)
if (!(console as any).isPatched) {
    console.log = (...args) => {
        addLog('log', args);
        originalConsoleLog(...args);
    };
    console.error = (...args) => {
        addLog('error', args);
        originalConsoleError(...args);
    };
    (console as any).isPatched = true;
}

export default function DebugOverlay() {
    const [visible, setVisible] = useState(false);
    const { user, isAuthenticated, isLoading, initialized } = useAuthStore();
    const { width, height } = useWindowDimensions();
    const pathname = usePathname();
    const [localLogs, setLocalLogs] = useState<string[]>([]);
    const [, forceUpdate] = useState({});

    useEffect(() => {
        const interval = setInterval(() => {
            if (visible) {
                setLocalLogs([...logs]);
                forceUpdate({});
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [visible]);

    if (!visible) {
        return (
            <Pressable style={styles.toggleBtn} onPress={() => setVisible(true)}>
                <Text style={styles.toggleText}>🐞</Text>
            </Pressable>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Debug Mode</Text>
                <Pressable onPress={() => setVisible(false)}>
                    <Text style={styles.closeBtn}>Close</Text>
                </Pressable>
            </View>
            <ScrollView style={styles.content}>
                <Text style={styles.section}>System</Text>
                <Text style={styles.text}>Dims: {width.toFixed(0)} x {height.toFixed(0)}</Text>
                <Text style={styles.text}>Path: {pathname}</Text>

                <Text style={styles.section}>Auth</Text>
                <Text style={styles.text}>Init: {initialized ? 'YES' : 'NO'}</Text>
                <Text style={styles.text}>Loading: {isLoading ? 'YES' : 'NO'}</Text>
                <Text style={styles.text}>Authed: {isAuthenticated ? 'YES' : 'NO'}</Text>
                <Text style={styles.text}>User: {user?.email || 'None'}</Text>

                <Text style={styles.section}>Logs</Text>
                {localLogs.map((log, i) => (
                    <Text key={i} style={[styles.log, log.startsWith('[ERROR]') && styles.error]}>
                        {log}
                    </Text>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    toggleBtn: {
        position: 'absolute',
        bottom: 40,
        right: 20,
        width: 44,
        height: 44,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    toggleText: {
        fontSize: 24,
    },
    container: {
        position: 'absolute',
        top: 40,
        left: 20,
        right: 20,
        bottom: 100,
        backgroundColor: 'rgba(0,0,0,0.9)',
        borderRadius: 12,
        zIndex: 9999,
        padding: 12,
        borderWidth: 1,
        borderColor: '#444',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    title: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    closeBtn: {
        color: '#ff5555',
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    section: {
        color: '#aaa',
        fontWeight: 'bold',
        marginTop: 8,
        marginBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    text: {
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: 12,
    },
    log: {
        color: '#88cc88',
        fontSize: 10,
        fontFamily: 'monospace',
        marginBottom: 2,
    },
    error: {
        color: '#ff6666',
    }
});
