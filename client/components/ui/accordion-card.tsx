import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
export default function AccordionCard({
    open, onToggle, icon, iconBg, iconColor, title, subtitle, children,
}: {
    open: boolean
    onToggle: () => void
    icon: React.ReactNode
    iconBg: string
    iconColor: string
    title: string
    subtitle: string
    children: React.ReactNode
}) {
    return (
        <div style={{
            background: '#fff', border: '1px solid #E4E4DF',
            borderRadius: 22, boxShadow: '0 2px 12px rgba(36,43,53,0.06)', overflow: 'hidden',
        }}>
            <motion.button
                whileHover={{ background: open ? '#fff' : '#FAFAF8' }}
                onClick={onToggle}
                style={{
                    width: '100%', padding: '20px 22px', border: 'none', background: '#fff',
                    display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
                    fontFamily: 'inherit', borderBottom: open ? '1px solid #F0F0EB' : 'none',
                    transition: 'border-color 0.2s',
                }}
            >
                <div style={{
                    width: 40, height: 40, borderRadius: 12, background: iconBg,
                    border: `1px solid ${iconColor}22`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                    {icon}
                </div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: 17, fontWeight: 500, color: '#1A1A18', letterSpacing: '-0.035em', lineHeight: 1.2 }}>
                        {title}
                    </div>
                    <div style={{ fontSize: 12, color: '#8A8A82', letterSpacing: '-0.01em', marginTop: 2 }}>
                        {subtitle}
                    </div>
                </div>
                <motion.div
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                    style={{ flexShrink: 0 }}
                >
                    <ChevronDown size={18} color="#8A8A82" strokeWidth={1.8} />
                </motion.div>
            </motion.button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{ padding: '20px 22px' }}>
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}