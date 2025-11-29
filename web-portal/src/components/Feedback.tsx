import { useState } from 'react';
import { 
  Star, 
  Send, 
  CheckCircle2, 
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Bug,
  Sparkles
} from 'lucide-react';

type FeedbackType = 'general' | 'bug' | 'feature' | 'praise';

interface FeedbackOption {
  type: FeedbackType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

export function Feedback() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const feedbackOptions: FeedbackOption[] = [
    { type: 'general', label: 'General', icon: <MessageSquare size={20} />, description: 'Share your thoughts' },
    { type: 'bug', label: 'Bug Report', icon: <Bug size={20} />, description: 'Something not working?' },
    { type: 'feature', label: 'Feature Request', icon: <Lightbulb size={20} />, description: 'Suggest improvements' },
    { type: 'praise', label: 'Praise', icon: <Sparkles size={20} />, description: 'Tell us what you love' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setSubmitted(true);
    
    // Reset after 5 seconds
    setTimeout(() => {
      setSubmitted(false);
      setRating(0);
      setMessage('');
      setFeedbackType('general');
    }, 5000);
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="card text-center" style={{ maxWidth: '500px', padding: '48px' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            background: 'var(--color-success-bg)', 
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <CheckCircle2 size={40} style={{ color: 'var(--color-success)' }} />
          </div>
          <h2 className="text-2xl font-bold mb-3">Thank You!</h2>
          <p className="text-secondary mb-6">
            Your feedback has been submitted successfully. We appreciate you taking the time to help us improve.
          </p>
          <button 
            className="btn btn-secondary"
            onClick={() => setSubmitted(false)}
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">We'd Love Your Feedback</h2>
        <p className="text-secondary">Help us improve the Scarmonit experience</p>
      </div>

      {/* Feedback Type Selection */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {feedbackOptions.map(option => (
          <button
            key={option.type}
            className={`card card-interactive text-center ${feedbackType === option.type ? '' : ''}`}
            style={{ 
              padding: '20px',
              borderColor: feedbackType === option.type ? 'var(--color-primary)' : undefined,
              background: feedbackType === option.type ? 'rgba(99, 102, 241, 0.1)' : undefined
            }}
            onClick={() => setFeedbackType(option.type)}
          >
            <div style={{ 
              color: feedbackType === option.type ? 'var(--color-primary)' : 'var(--text-secondary)',
              marginBottom: '8px'
            }}>
              {option.icon}
            </div>
            <div className="font-medium text-sm">{option.label}</div>
            <div className="text-xs text-muted mt-1">{option.description}</div>
          </button>
        ))}
      </div>

      {/* Feedback Form */}
      <div className="card">
        <form onSubmit={handleSubmit}>
          {/* Rating */}
          <div className="mb-6">
            <label className="text-sm text-secondary mb-3 block">How would you rate your experience?</label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-2 transition-transform hover:scale-110"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star 
                    size={36} 
                    fill={star <= (hoverRating || rating) ? 'var(--color-warning)' : 'none'}
                    style={{ 
                      color: star <= (hoverRating || rating) ? 'var(--color-warning)' : 'var(--text-muted)',
                      transition: 'all 0.2s'
                    }} 
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <div className="text-center mt-2 text-sm">
                {rating === 5 && <span className="text-success">Excellent! We're glad you love it!</span>}
                {rating === 4 && <span className="text-primary-color">Great! Thanks for the positive feedback!</span>}
                {rating === 3 && <span className="text-secondary">Good. Tell us how we can improve.</span>}
                {rating === 2 && <span className="text-warning">We'll work harder. What can we do better?</span>}
                {rating === 1 && <span className="text-danger">We're sorry. Please share what went wrong.</span>}
              </div>
            )}
          </div>

          {/* Quick Feedback Buttons */}
          <div className="mb-6">
            <label className="text-sm text-secondary mb-3 block">Quick feedback (optional)</label>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                'Easy to use',
                'Great design',
                'Fast performance',
                'Needs improvement',
                'Missing features',
                'Love the agents!'
              ].map(tag => (
                <button
                  key={tag}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setMessage(prev => prev ? `${prev}, ${tag}` : tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div className="mb-6">
            <label className="text-sm text-secondary mb-2 block">Tell us more (optional)</label>
            <textarea
              className="input"
              placeholder="Share your thoughts, suggestions, or report issues..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted">
              Your feedback helps us build a better product.
            </p>
            <button 
              type="submit" 
              className="btn btn-primary btn-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid white',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Submit Feedback
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Help Links */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="card card-interactive flex items-center gap-3" style={{ padding: '16px' }}>
          <ThumbsUp size={24} style={{ color: 'var(--color-success)' }} />
          <div>
            <div className="font-medium">Join Our Community</div>
            <div className="text-sm text-muted">Connect with other users</div>
          </div>
        </div>
        <div className="card card-interactive flex items-center gap-3" style={{ padding: '16px' }}>
          <MessageSquare size={24} style={{ color: 'var(--color-primary)' }} />
          <div>
            <div className="font-medium">Contact Support</div>
            <div className="text-sm text-muted">Get help from our team</div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
