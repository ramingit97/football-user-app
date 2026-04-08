import { useState } from 'react';
import { Modal, Rate, Input, message } from 'antd';
import axios from 'axios';
import { API_BASE } from '../config.js';
import { useGetProfileQuery } from '../store/authApi';

const { TextArea } = Input;

const EMOJI = ['', '😞', '😐', '🙂', '😊', '🤩'];

const FeedbackModal = ({ open, onClose }) => {
    const { data: user } = useGetProfileQuery();
    const [rating, setRating] = useState(0);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!rating) { message.warning('Zəhmət olmasa qiymət verin'); return; }
        setLoading(true);
        try {
            await axios.post(`${API_BASE}/api/analytics/feedback`, {
                rating,
                text: text.trim(),
                userName: user?.name,
                userId: user?.id,
            });
            message.success('Rəyiniz üçün təşəkkür edirik! 🙏');
            setRating(0);
            setText('');
            onClose();
        } catch {
            message.error('Xəta baş verdi, bir az sonra cəhd edin');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            onOk={handleSubmit}
            confirmLoading={loading}
            okText="Göndər"
            cancelText="Ləğv et"
            okButtonProps={{ disabled: !rating, style: { background: rating ? 'var(--green)' : undefined, borderColor: rating ? 'var(--green)' : undefined, color: rating ? '#060c18' : undefined, fontWeight: 700 } }}
            centered
            width={420}
            title={null}
            styles={{ content: { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 16 }, header: { background: 'transparent' }, footer: { borderTop: '1px solid var(--border-color)', background: 'transparent' } }}
        >
            <div style={{ padding: '8px 0 4px', textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>
                    {rating ? EMOJI[rating] : '💬'}
                </div>
                <div style={{
                    fontFamily: "'ClashDisplay-Variable','Clash Display',sans-serif",
                    fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', marginBottom: 4,
                }}>
                    Sayt haqqında rəyiniz
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 24 }}>
                    Topin.az-ı necə qiymətləndirirsiniz?
                </div>

                {/* Stars */}
                <Rate
                    value={rating}
                    onChange={setRating}
                    style={{ fontSize: 36, color: '#faad14', marginBottom: 20 }}
                />

                {/* Text */}
                <TextArea
                    placeholder="Fikirlərinizi yazın... (istəyə görə)"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    rows={3}
                    maxLength={500}
                    showCount
                    style={{ background: 'var(--bg-raised)', borderColor: 'var(--border-color)', color: 'var(--text-primary)', resize: 'none' }}
                />
            </div>
        </Modal>
    );
};

export default FeedbackModal;
