
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface DeleteAccountModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({visible,onClose,onConfirm,}) =>{

  const [countdown, setCountdown] = useState(5);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(()=>{
    let timer: NodeJS.Timeout;

    //Resetting countdown when modal opens
    if(visible){
      setCountdown(5);
      setIsDeleting(false);

      //Start countdown
      timer = setInterval(()=>{
        setCountdown((prevCount)=>{
          if(prevCount<=1){
            clearInterval(timer);
            setIsDeleting(true);
            //Execute delete after countdown reaches 0
            onConfirm();
            return 0;
          }
          return prevCount -1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  },[visible]);

  return (
    <Modal
    visible={visible}
    transparent={true}
    animationType='fade'
    onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.warningIconContainer}>
            <MaterialIcons name="warning" size={5} color="#FFC107"/>
          </View>
          <Text style={styles.modalTitle}>Delete Account</Text>

          <Text style={styles.modalDescription}>
            Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed
          </Text>

          {isDeleting?(
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#F87171"/>
              <Text style={styles.deletingText}>Deleting Account...</Text>
            </View>
          ):(
            <>
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>
                Deleting in <Text style={styles.countdownNumber}>{countdown} </Text>seconds
              </Text>
              <View style={styles.progressBar}>
                <View style={[ styles.progressFill, {width:`${(countdown/5)*100}%`}]}>
                </View>
              </View>
              
            </View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteNowButton} onPress={()=>{setIsDeleting(true); onConfirm();}}>
                  <Text style={styles.deleteNowButtonText}>Delete Now</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  warningIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 16,
  },
  modalDescription: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  countdownContainer: {
    width: '100%',
    marginBottom: 24,
  },
  countdownText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
  },
  countdownNumber: {
    fontWeight: '700',
    color: '#F87171',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F87171',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '600',
  },
  deleteNowButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    marginLeft: 10,
    alignItems: 'center',
  },
  deleteNowButtonText: {
    color: '#F87171',
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  deletingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
});export default DeleteAccountModal