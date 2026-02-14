import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const DATA = [
    { id: '1', title: 'Mixed Post 1', description: 'Something interesting', hashtag: '#mix' },
    { id: '2', title: 'Mixed Post 2', description: 'Another cool thing', hashtag: '#cool' },
    { id: '3', title: 'Mixed Post 3', description: 'Final test item', hashtag: '#final' },
];

export default function MixFeedScreen() {
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
