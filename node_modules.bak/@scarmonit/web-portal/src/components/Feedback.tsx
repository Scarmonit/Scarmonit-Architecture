import { useState } from 'react';

export function Feedback() {
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 text-center">System Feedback</h2>
      
      <div className="card feedback-form">
        <p className="text-center text-dim mb-4">Help us improve the Neural Architecture.</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex justify-center gap-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`text-4xl transition-transform hover:scale-110 ${star <= rating ? 'text-warning' : 'text-dim'}`}
                onClick={() => setRating(star)}
              >
                ★
              </button>
            ))}
          </div>
          
          <textarea 
            placeholder="Describe your experience with the autonomous agents..."
            className="w-full"
          />
          
          <button type="submit" className="btn btn-primary w-full">
            {submitted ? '✓ Submitted Successfully' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
}
