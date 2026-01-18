import pickle

# Load speed model
with open('speed_model.pkl', 'rb') as f:
    speed_model = pickle.load(f)

# Load congestion model
with open('congestion_model.pkl', 'rb') as f:
    congestion_model = pickle.load(f)

print("=== SPEED MODEL FEATURES ===")
print(list(speed_model.feature_names_in_))

print("\n=== CONGESTION MODEL FEATURES ===")
print(list(congestion_model.feature_names_in_))
