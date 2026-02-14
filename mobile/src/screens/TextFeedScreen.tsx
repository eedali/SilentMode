import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const DATA = [
    { id: '1', title: 'First Post', description: 'This is a test post', hashtag: '#test' },
    { id: '2', title: 'Another One', description: 'Testing the feed', hashtag: '#feed' },
    { id: '3', title: 'Hello World', description: 'SilentMode is live', hashtag: '#silentmode' },
];

export default function TextFeedScreen() {
    return (
        <View style={styles.container}>
            <FlatList
                data={DATA}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Text style={styles.title}>{item.title}</Text>
                        <Text style={styles.desc}>{item.description}</Text>
                        <Text style={styles.tag}>{item.hashtag}</Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f2f2f2', padding: 10 },
    card: { backgroundColor: '#fff', padding: 15, marginBottom: 10, borderRadius: 8 },
    title: { fontSize: 18, fontWeight: 'bold' },
    desc: { fontSize: 14, marginVertical: 5 },
    tag: { fontSize: 12, color: 'blue' },
});
