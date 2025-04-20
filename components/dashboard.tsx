import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Dimensions,
  StatusBar,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  FontAwesome5
} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import CreateEstimate from '../../components/CreateEstimate';
import AddClientModal from '../../components/AddClientModal';

const { width } = Dimensions.get('window');

// Mock data for recent estimates
const RECENT_ESTIMATES = [
  { id: '1', client: 'Global Solutions', amount: '$4,800.00', date: '27 Mar 2025', status: 'sent' },
  { id: '2', client: 'Bright Ideas LLC', amount: '$1,200.00', date: '20 Mar 2025', status: 'accepted' },
  { id: '3', client: 'Tech Innovators', amount: '$3,500.00', date: '15 Mar 2025', status: 'pending' },
];

// Define a Client interface
interface Client {
  name: string;
  phone: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('estimates');
  const [showEstimateModal, setShowEstimateModal] = useState(false);

  const openModal = () => setShowEstimateModal(true);
  const closeModal = () => setShowEstimateModal(false);

  const [clientModalVisible, setClientModalVisible] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  const handleAddClient = (client: Client) => {
    setClients([...clients, client]);
  };

  const navigateToCreateEstimate = () => {
    router.replace('/history');
  };

  interface EstimateItem {
    id: string;
    client: string;
    amount: string;
    date: string;
    status: string;
  }

  const renderStatusBadge = (status: string) => {
    let backgroundColor;
    let textColor = '#FFFFFF';
  
    switch (status) {
      case 'sent':
        backgroundColor = '#6C5CE7';
        break;
      case 'accepted':
        backgroundColor = '#00B894';
        break;
      default:
        backgroundColor = '#B2BEC3';
    }
    
    return (
      <View style={[styles.statusBadge, { backgroundColor }]}>
        <Text style={[styles.statusText, { color: textColor }]}>{status}</Text>
      </View>
    );
  };

  const renderEstimateItem = ({ item }: { item: EstimateItem }) => (
    <TouchableOpacity style={styles.invoiceItem}>
      <View style={styles.invoiceLeftContent}>
        <Text style={styles.clientName}>{item.client}</Text>
        <Text style={styles.invoiceDate}>{item.date}</Text>
      </View>
      <View style={styles.invoiceRightContent}>
        <Text style={styles.invoiceAmount}>{item.amount}</Text>
        {renderStatusBadge(item.status)}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello there,</Text>
            <Text style={styles.businessName}>Your Business</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <LinearGradient
              colors={['#6C5CE7', '#8E5CE7']}
              style={styles.profileGradient}
            >
              <Text style={styles.profileInitials}>YB</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.summaryContainer}
        >
          <LinearGradient
            colors={['#6C5CE7', '#8E5CE7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryCard}
          >
            <View style={styles.summaryIconContainer}>
              <MaterialIcons name="hourglass-bottom" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.summaryTitle}>Pending</Text>
            <Text style={styles.summaryAmount}>$8,240.00</Text>
            <Text style={styles.summarySubtext}>3 Estimates</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#00B894', '#00CEC9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryCard}
          >
            <View style={styles.summaryIconContainer}>
              <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.summaryTitle}>Accepted</Text>
            <Text style={styles.summaryAmount}>$12,450.00</Text>
            <Text style={styles.summarySubtext}>5 Estimates</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#FF7675', '#FD79A8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryCard}
          >
            <View style={styles.summaryIconContainer}>
              <MaterialIcons name="payments" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.summaryTitle}>Revenue</Text>
            <Text style={styles.summaryAmount}>$56,320.00</Text>
            <Text style={styles.summarySubtext}>This Month</Text>
          </LinearGradient>
        </ScrollView>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={openModal}
          >
            <LinearGradient
              colors={['#00B894', '#00CEC9']}
              style={styles.actionIconContainer}
            >
              <MaterialCommunityIcons name="calculator-variant" size={22} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.actionText}>New Estimate</Text>
          </TouchableOpacity>

           {/* Estimate Modal */}
              <Modal
                visible={showEstimateModal}
                animationType="slide"
                onRequestClose={closeModal}
              >
                <View style={{ flex: 1 }}>
                <TouchableOpacity 
                    onPress={closeModal} 
                    style={{ position: 'absolute', top: 18, right: 10, zIndex: 1 }}
                  >
                    <MaterialCommunityIcons name="close-circle" size={30} color="#64748B" />
              </TouchableOpacity>
                  <CreateEstimate />
                </View>
              </Modal>

            <TouchableOpacity style={styles.actionButton}  onPress={() => setClientModalVisible(true)}>
              <LinearGradient
                colors={['#6C5CE7', '#8E5CE7']}
                style={styles.actionIconContainer}
              >
                <FontAwesome5 name="user-plus" size={20} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.actionText}>Add Client</Text>
            </TouchableOpacity>
            <AddClientModal
            visible={clientModalVisible}
            onClose={() => setClientModalVisible(false)}
            onAddClient={handleAddClient}
          />
              {clients.map((client, index) => (
            <Text key={index}>{client.name} - {client.phone}</Text>
          ))}
          </View>
        </View>

        {/* Recent Activity Tabs */}
        <View style={styles.recentContainer}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity style={styles.viewAllTextButton}>
              <Text style={styles.viewAllTextButtonLabel}>View All</Text>
              <MaterialIcons name="chevron-right" size={18} color="#6C5CE7" />
            </TouchableOpacity>
          </View>
          
          {/* <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'estimates' && styles.activeTab]}
              onPress={() => setActiveTab('estimates')}
            >
              <Text 
                style={[styles.tabText, activeTab === 'estimates' && styles.activeTabText]}
              >
                Estimates
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'invoices' && styles.activeTab]}
              onPress={() => setActiveTab('invoices')}
            >
              <Text 
                style={[styles.tabText, activeTab === 'invoices' && styles.activeTabText]}
              >
                Invoices
              </Text>
            </TouchableOpacity>
          </View> */}

          {/* Recent Activity List */}
          <View style={styles.recentList}>
            {RECENT_ESTIMATES.length > 0 ? (
              <FlatList
                data={RECENT_ESTIMATES}
                renderItem={renderEstimateItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="calculator-variant-outline" size={60} color="#D1D8E0" />
                <Text style={styles.emptyStateText}>No estimates yet</Text>
                <TouchableOpacity style={styles.emptyStateButton}>
                  <Text style={styles.emptyStateButtonText}>Create First Estimate</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  businessName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 4,
  },
  profileButton: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  profileGradient: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  summaryCard: {
    width: width * 0.4,
    minWidth: 160,
    height: 130,
    borderRadius: 18,
    marginHorizontal: 5,
    padding: 16,
    justifyContent: 'space-between',
  },
  summaryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 10,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  summarySubtext: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  quickActionsContainer: {
    marginTop: 15,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 15,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  recentContainer: {
    marginTop: 25,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAllTextButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllTextButtonLabel: {
    color: '#6C5CE7',
    fontSize: 14,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 5,
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  activeTabText: {
    color: '#6C5CE7',
    fontWeight: '600',
  },
  recentList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 120,
  },
  invoiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  invoiceLeftContent: {
    flex: 1,
  },
  invoiceRightContent: {
    alignItems: 'flex-end',
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 5,
  },
  invoiceDate: {
    fontSize: 13,
    color: '#64748B',
  },
  invoiceAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyStateText: {
    marginTop: 10,
    marginBottom: 15,
    fontSize: 16,
    color: '#64748B',
  },
  emptyStateButton: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginTop: 10,
  },
  viewAllText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6C5CE7',
    marginRight: 5,
  },
});