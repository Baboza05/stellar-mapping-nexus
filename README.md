# Stellar Mapping Nexus

A blockchain-based distributed observation platform enabling astronomers to catalog celestial discoveries with community-driven validation and achievement recognition.

## Purpose

Stellar Mapping Nexus provides a decentralized infrastructure for recording, verifying, and archiving astronomical observations on the Stacks blockchain. The platform combines scientific rigor with gamification, allowing observers worldwide to contribute to a permanent, immutable astronomical database while earning recognition for their contributions.

## Features

- **Distributed Observation Registry**: Record detailed astronomical observations with full metadata on an immutable ledger
- **Community Validation**: Peer-review system where observers validate each other's submissions
- **Achievement Recognition**: Earn distinct honors based on participation metrics and milestones
- **Object Category Tracking**: Monitor diversity of celestial objects observed
- **Proof of Evidence**: Support for cryptographic hashes linking to external verification data
- **Tamper-proof Archive**: All observations permanently stored on the Stacks blockchain

## System Architecture

Stellar Mapping Nexus is built around the `celestial-nexus-core` smart contract, which manages the entire observation lifecycle:

```
┌─────────────────────────────────────────────────────────┐
│           Observer Registration & Profiles              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐         ┌──────────────┐            │
│  │  Submit      │────────▶│  Observation │            │
│  │  Observation │         │  Records     │            │
│  └──────────────┘         └──────────────┘            │
│         │                        │                     │
│         └────────┬───────────────┘                     │
│                  │                                     │
│          ┌───────▼──────────┐                         │
│          │ Achievement      │                         │
│          │ Evaluation       │                         │
│          └───────┬──────────┘                         │
│                  │                                     │
│         ┌────────▼──────────┐                         │
│         │  Award Honors     │                         │
│         └───────────────────┘                         │
│                                                       │
│  ┌──────────────┐         ┌──────────────┐          │
│  │  Validate    │────────▶│  Validation  │          │
│  │  Records     │         │  Ledger      │          │
│  └──────────────┘         └──────────────┘          │
│                                                       │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Clarinet 1.4+
- Node.js 18+
- A Stacks wallet for deployment

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/stellar-mapping-nexus.git
cd stellar-mapping-nexus

# Install dependencies
npm install

# Deploy contract
clarinet deploy --network testnet
```

## Usage Examples

### Register as an Observer

```clarity
(contract-call? .celestial-nexus-core 
  establish-observer-account 
  "CosmicWatcher")
```

### Record an Astronomical Observation

```clarity
(contract-call? .celestial-nexus-core
  submit-celestial-observation
  "NGC 224"              ;; target designation
  "Galaxy"              ;; observation type
  "00h 42m 44s"        ;; RA coordinate
  "+41° 16' 9\""       ;; DEC coordinate
  "Mountain Observatory" ;; site location
  "Excellent"          ;; atmospheric transparency
  "Clear skies"        ;; conditions
  "14-inch Reflector"  ;; instrument
  "Spiral structure clearly visible in core region"
  none)                ;; optional verification hash
```

### Validate Existing Observation

```clarity
(contract-call? .celestial-nexus-core
  validate-celestial-record
  u1)  ;; observation record ID
```

## Core Functions

### Public Functions

#### `establish-observer-account`
Registers a new observer in the platform. Automatically confers a founding membership honor.

**Parameters:**
- `display-handle`: Observer's username (UTF8, max 50 chars)

**Returns:** ok if successful, err if invalid parameters

#### `submit-celestial-observation`
Records a new astronomical observation with complete metadata.

**Parameters:**
- `target-designation`: Name of celestial object (UTF8, max 100 chars)
- `observation-type`: Category/classification (UTF8, max 50 chars)
- `ra-coordinate`: Right ascension (UTF8, max 20 chars)
- `dec-coordinate`: Declination (UTF8, max 20 chars)
- `observation-site`: Location of observation (UTF8, max 100 chars)
- `transparency-level`: Atmospheric clarity (UTF8, max 50 chars)
- `atmospheric-conditions`: Weather/sky conditions (UTF8, max 100 chars)
- `device-used`: Instrument description (UTF8, max 200 chars)
- `observer-notes`: Detailed observations (UTF8, max 500 chars)
- `verification-hash`: Optional proof hash (32-byte buffer)

**Returns:** ok with observation ID if successful

#### `validate-celestial-record`
Verifies another observer's submitted record. Prevents self-validation and duplicate validations.

**Parameters:**
- `record-id`: ID of the observation to validate (uint)

**Returns:** ok if validation recorded successfully

#### `establish-honor-type`
Creates a new achievement honor type (admin function).

**Parameters:**
- `honor-title`: Name of the honor (UTF8, max 50 chars)
- `honor-summary`: Description (UTF8, max 200 chars)
- `achievement-requirements`: Eligibility criteria (UTF8, max 200 chars)
- `honor-tier`: Rarity/tier level (UTF8, max 20 chars)

**Returns:** ok with honor ID if created successfully

### Read-Only Functions

#### `fetch-observer-data`
Retrieves observer profile information and statistics.

#### `fetch-record-data`
Gets complete observation record details.

#### `has-validated`
Checks if a specific observer has validated a record.

#### `fetch-honor-data`
Retrieves honor type information and requirements.

#### `fetch-observer-honor`
Checks if an observer has earned a specific honor.

#### `fetch-category-stats`
Gets count of objects observed in a specific category by an observer.

## Achievement System

The platform automatically evaluates achievements based on observer activity:

- **Founding Member** (Honor ID 0): Granted at registration
- **Dedicated Observer** (Honor ID 1): Awarded upon 5+ submissions
- **Community Validator** (Honor ID 4): Awarded when a single observation receives 10+ validations
- **Validation Expert** (Honor ID 5): Awarded upon 10+ successful validations

## Data Structure Reference

### observer-profiles
Maps principal addresses to observer metadata including registration block, submission count, and validation tally.

### observation-records
Stores complete observation data including coordinates, metadata, conditions, and validation statistics.

### validation-ledger
Tracks which observers have validated which observations, preventing duplicate validations.

### recognition-types
Defines available honors with titles, descriptions, requirements, and tier classifications.

### observer-honors
Records which honors each observer has earned and at what block height.

### observer-categories
Maintains statistics on observation diversity per observer.

## Security Considerations

### Current Implementation Notes

1. **Validation Mechanism**: Relies on community participation and trust
2. **Evidence Hashes**: Off-chain proof generation recommended
3. **Authorization**: Admin functions use basic authorization (production deployment requires enhancement)

### Recommendations

- Verify all observations before acting on them
- Validate transaction success before updating UI state
- Use proper key management and access controls
- Implement multi-signature authorization for admin functions in production
- Consider rate limiting for high-volume observers
- Validate all input data for expected format and length

## Development

### Running Tests

```bash
npm run test
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:report
```

### Local Console

```bash
clarinet console

# Then in the console:
(contract-call? .celestial-nexus-core establish-observer-account "TestObserver")
```

## Project Structure

```
stellar-mapping-nexus/
├── contracts/
│   └── celestial-nexus-core.clar       # Main contract
├── tests/
│   └── celestial-nexus-core_test.ts    # Test suite
├── settings/
│   ├── Devnet.toml                     # Development settings
│   ├── Testnet.toml                    # Testnet settings
│   └── Mainnet.toml                    # Mainnet settings
├── Clarinet.toml                       # Project configuration
├── package.json                        # Node dependencies
└── README.md                          # This file
```

## Technical Stack

- **Smart Contract Language**: Clarity
- **Blockchain**: Stacks (PoX consensus)
- **Testing Framework**: Vitest with Clarinet SDK
- **Runtime**: Node.js with TypeScript support

## Gas & Cost Optimization

- Observation submission: ~200 STX (includes metadata storage)
- Record validation: ~150 STX
- Observer registration: ~100 STX
- Honor creation: ~100 STX (admin only)

## Network Deployment

### Testnet Deployment

```bash
clarinet deploy --network testnet
```

### Mainnet Deployment

```bash
clarinet deploy --network mainnet
```

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your improvements
4. Write/update tests
5. Submit a pull request

## Roadmap

- [ ] Cross-chain verification integration
- [ ] Advanced statistical analysis endpoints
- [ ] Observer reputation scoring
- [ ] Multi-tier honor system expansion
- [ ] Integration with astronomical databases
- [ ] Web3 wallet discovery features
- [ ] Real-time observation feeds

## License

Licensed under the MIT License. See LICENSE file for details.

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review test cases for usage examples
- Consult the Clarity language reference

## Acknowledgments

Built with Clarity and the Stacks blockchain ecosystem.
